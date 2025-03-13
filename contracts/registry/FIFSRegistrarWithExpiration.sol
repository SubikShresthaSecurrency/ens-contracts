pragma solidity >=0.8.4;

import "./ENS.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../resolvers/Resolver.sol";

/**
 * A registrar that allocates subdomains to the first person to claim them,
 * with expiration functionality similar to BaseRegistrarImplementation.
 */
contract FIFSRegistrarWithExpiration is Ownable {
    ENS public ens;
    bytes32 public rootNode;

    // A map of expiration times for each subdomain (label hash)
    mapping(bytes32 => uint256) public expiries;

    // A grace period after expiration during which the domain can still be renewed
    uint256 public constant GRACE_PERIOD = 90 days;

    // Events
    event NameRegistered(
        bytes32 indexed label,
        address indexed owner,
        uint256 expires
    );
    event NameRenewed(bytes32 indexed label, uint256 expires);
    event NameExpired(bytes32 indexed label);
    event NameReclaimed(bytes32 indexed label, address indexed owner);

    /**
     * @dev Constructor.
     * @param ensAddr The address of the ENS registry.
     * @param node The node (namehash) that this registrar administers.
     */
    constructor(ENS ensAddr, bytes32 node) {
        ens = ensAddr;
        rootNode = node;
    }

    modifier only_owner(bytes32 label) {
        address currentOwner = ens.owner(
            keccak256(abi.encodePacked(rootNode, label))
        );
        require(currentOwner == address(0x0) || currentOwner == msg.sender);
        _;
    }

    /**
     * @dev Register a name.
     * @param label The hash of the label to register.
     * @param owner The address of the new owner.
     * @param duration Duration in seconds for the registration.
     */
    function register(
        bytes32 label,
        address owner,
        uint256 duration
    ) external only_owner(label) {
        require(owner != address(0), "Invalid owner address");
        require(duration > 0, "Duration must be greater than zero");
        require(available(label), "Name not available");

        uint256 expires = block.timestamp + duration;
        expiries[label] = expires;

        // Set ownership in the ENS registry
        ens.setSubnodeOwner(rootNode, label, owner);

        emit NameRegistered(label, owner, expires);
    }

    function doRegistration(
        bytes32 node,
        bytes32 label,
        address subdomainOwner,
        Resolver resolver,
        uint256 duration
    ) external {
        require(duration > 0, "Duration must be greater than zero");
        require(available(label), "Name not available");

        uint256 expires = block.timestamp + duration;
        expiries[label] = expires;

        // Get the subdomain so we can configure it
        ens.setSubnodeOwner(node, label, address(this));

        bytes32 subnode = keccak256(abi.encodePacked(node, label));

        // Set the subdomain's resolver
        ens.setResolver(subnode, address(resolver));

        // Set the address record on the resolver
        resolver.setAddr(subnode, subdomainOwner);

        // Pass ownership of the new subdomain to the registrant
        ens.setOwner(subnode, subdomainOwner);
    }

    /**
     * @dev Renew a name.
     * @param label The hash of the label to renew.
     * @param duration Duration in seconds to extend the registration.
     */
    function renew(bytes32 label, uint256 duration) external {
        require(duration > 0, "Duration must be greater than zero");
        require(
            expiries[label] + GRACE_PERIOD >= block.timestamp,
            "Name cannot be renewed"
        );

        // Only the current owner can renew
        address currentOwner = ens.owner(
            keccak256(abi.encodePacked(rootNode, label))
        );
        require(msg.sender == currentOwner, "Only the owner can renew");

        expiries[label] = expiries[label] + duration;

        emit NameRenewed(label, expiries[label]);
    }

    /**
     * @dev Reclaim ownership of a name in ENS, if you own it in the registrar.
     * Similar to BaseRegistrarImplementation's reclaim function.
     * @param label The hash of the label to reclaim.
     * @param owner The address to set as the owner in ENS.
     */
    function reclaim(bytes32 label, address owner) external {
        require(owner != address(0), "Invalid owner address");
        require(registered(label), "Name is not registered");
        require(
            msg.sender ==
                ens.owner(keccak256(abi.encodePacked(rootNode, label))),
            "Only the owner can reclaim"
        );

        ens.setSubnodeOwner(rootNode, label, owner);

        emit NameReclaimed(label, owner);
    }

    /**
     * @dev Check if a name is available for registration.
     * @param label The hash of the label to check.
     */
    function available(bytes32 label) public view returns (bool) {
        return !registered(label);
    }

    /**
     * @dev Check if a name is registered and not expired.
     * @param label The hash of the label to check.
     */
    function registered(bytes32 label) public view returns (bool) {
        uint256 expiry = expiries[label];
        return expiry + GRACE_PERIOD > block.timestamp;
    }

    /**
     * @dev Get the owner of a name.
     * Returns address(0) if the name is expired.
     * @param label The hash of the label.
     */
    function ownerOf(bytes32 label) public view returns (address) {
        if (registered(label)) {
            return ens.owner(keccak256(abi.encodePacked(rootNode, label)));
        } else {
            return address(0);
        }
    }

    function nameExpires(bytes32 label) external view returns (uint256) {
        return expiries[label];
    }

    /**
     * @dev Allows the owner to set the resolver for the root node.
     * @param resolver The address of the resolver.
     */
    function setResolver(address resolver) external onlyOwner {
        ens.setResolver(rootNode, resolver);
    }

    /**
     * @dev Allows the owner to reclaim ownership of the root node in ENS, if needed.
     */
    function reclaimRootNode() external onlyOwner {
        ens.setOwner(rootNode, owner());
    }
}
