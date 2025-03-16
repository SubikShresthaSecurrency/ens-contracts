// Copyright 2024 DTCC All Rights Reserved
// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.22;

import {IUpdatesRepository} from "updates-repository-contracts/src/updates-repository/interfaces/IUpdatesRepository.sol";
import {IPackage} from "updates-repository-contracts/src/common/interfaces/upgradability/IPackage.sol";
import {IComponentIdGetter} from "updates-repository-contracts/src/common/interfaces/upgradability/IComponentIdGetter.sol";
import {IERC165} from "updates-repository-contracts/src/common/interfaces/IERC165.sol";
import {IUpgradable} from "updates-repository-contracts/src/common/interfaces/upgradability/IUpgradable.sol";
import {RoleAgencyBase} from "../role-agency/RoleAgencyBase.sol";
import {UpgradabilityStorageLib} from "../upgradability/UpgradabilityStorageLib.sol";
// prettier-ignore
import {
    UpdatesRepositoryVersionsVerificationsLib
} from "updates-repository-contracts/src/updates-repository/packages/init/internal/storage-functions/UpdatesRepositoryVersionsVerificationsLib.sol";
import {BytesHelper} from "../../libraries/BytesHelper.sol";
import {Action} from "updates-repository-contracts/src/updates-repository/UpdatesRepositoryStructures.sol";
import {IUpgradabilityErrors} from "./IUpgradabilityErrors.sol";

/// @title UpgradablePackage
abstract contract UpgradablePackage is
    RoleAgencyBase,
    IUpgradable,
    IComponentIdGetter
{
    /// @inheritdoc IUpgradable
    function update() external override onlyController {
        // upgradability storage - EIP-7201
        UpgradabilityStorageLib.UpgradabilityStorage
            storage upgradabilityStorage = UpgradabilityStorageLib
                ._getUpgradabilityStorage();

        (
            address package,
            bytes4[] memory methods,
            Action[] memory actions
        ) = IUpdatesRepository(upgradabilityStorage._updatesRepositoryAddress)
                .updateComponent();

        upgradabilityStorage._methodsImplementations[
            IPackage.applyUpdate.selector
        ] = package;
        IPackage(address(this)).applyUpdate(methods, actions);

        delete upgradabilityStorage._methodsImplementations[
            IPackage.applyUpdate.selector
        ];
    }

    /// @inheritdoc IUpgradable
    function updateToSpecificVersion(
        string calldata version
    ) external virtual override onlyControllerOrProxy {
        // upgradability storage - EIP-7201
        UpgradabilityStorageLib.UpgradabilityStorage
            storage upgradabilityStorage = UpgradabilityStorageLib
                ._getUpgradabilityStorage();

        // check if the version is higher than the current version
        // Ensuring the provided version adheres to the expected format and does not contain typos
        UpdatesRepositoryVersionsVerificationsLib
            .verifyVersionIsHigherAndCorrect(
                BytesHelper._stringToBytes(version),
                BytesHelper._stringToBytes(
                    IUpgradable(address(this)).getCurrentVersion()
                )
            );
        // Verifying that the desired version exists
        if (
            !IUpdatesRepository(upgradabilityStorage._updatesRepositoryAddress)
                .verifyVersionExistsForComponent(getComponentId(), version)
        ) {
            revert IUpgradabilityErrors.VersionDoesNotExist();
        }
        // update the component to the next version
        (
            address package,
            bytes4[] memory methods,
            Action[] memory actions
        ) = IUpdatesRepository(upgradabilityStorage._updatesRepositoryAddress)
                .updateComponent();
        upgradabilityStorage._methodsImplementations[
            IPackage.applyUpdateToSpecificVersion.selector
        ] = package;
        IPackage(address(this)).applyUpdateToSpecificVersion(
            version,
            methods,
            actions
        );

        delete UpgradabilityStorageLib
            ._getUpgradabilityStorage()
            ._methodsImplementations[
                IPackage.applyUpdateToSpecificVersion.selector
            ];
    }

    /// @inheritdoc IUpgradable
    function getCurrentVersion()
        external
        view
        override
        returns (string memory)
    {
        return
            IUpdatesRepository(
                UpgradabilityStorageLib
                    ._getUpgradabilityStorage()
                    ._updatesRepositoryAddress
            ).getCurrentComponentVersion(address(this));
    }

    /// @inheritdoc IUpgradable
    function getLatestVersion() external view override returns (string memory) {
        return
            IUpdatesRepository(
                UpgradabilityStorageLib
                    ._getUpgradabilityStorage()
                    ._updatesRepositoryAddress
            ).getLatestComponentVersion(getComponentId());
    }

    /// @inheritdoc IERC165
    function supportsInterface(
        bytes4 interfaceID
    ) external view virtual override returns (bool) {
        return
            interfaceID != 0xffffffff &&
            UpgradabilityStorageLib
                ._getUpgradabilityStorage()
                ._supportedInterfaces[interfaceID];
    }

    /// @inheritdoc IUpgradable
    function getPackageAddressForFunction(
        bytes4 funcSig
    ) external view returns (address) {
        return
            UpgradabilityStorageLib
                ._getUpgradabilityStorage()
                ._methodsImplementations[funcSig];
    }

    /// @inheritdoc IUpgradable
    function getFunctionSelectorsOfPackage(
        address packageAddress
    ) external view returns (bytes4[] memory) {
        return
            UpgradabilityStorageLib
                ._getUpgradabilityStorage()
                ._packageFunctionSelectors[packageAddress];
    }

    /// @inheritdoc IUpgradable
    function getPackagesUsedByCurrentComponent()
        external
        view
        override
        returns (address[] memory)
    {
        return
            IUpdatesRepository(
                UpgradabilityStorageLib
                    ._getUpgradabilityStorage()
                    ._updatesRepositoryAddress
            ).getPackagesUsedByComponent(address(this));
    }

    /// @inheritdoc IComponentIdGetter
    function getComponentId() public view virtual override returns (bytes32);
}
