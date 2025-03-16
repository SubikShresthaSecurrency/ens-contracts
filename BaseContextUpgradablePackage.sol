// Copyright 2024 DTCC All Rights Reserved
// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.22;

import {BaseContext} from "./BaseContext.sol";
import {UpgradablePackage} from "../upgradability/UpgradablePackage.sol";
import {IContext} from "../../../interfaces/IContext.sol";
import {IController} from "../../../interfaces/IController.sol";
import {IRoleAgency} from "../../../interfaces/role/IRoleAgency.sol";
// prettier-ignore
import { IContextPackageInitializationErrors } 
    from "./context-factory/interfaces/IContextPackageInitialization.sol";
import {IPackage} from "updates-repository-contracts/src/common/interfaces/upgradability/IPackage.sol";
import {IComponentIdGetter} from "updates-repository-contracts/src/common/interfaces/upgradability/IComponentIdGetter.sol";
import {IUpgradable} from "updates-repository-contracts/src/common/interfaces/upgradability/IUpgradable.sol";
import {IDefaultRoleRegistrar} from "../../../interfaces/role/IDefaultRoleRegistrar.sol";
import {UpgradabilityStorageLib} from "../upgradability/UpgradabilityStorageLib.sol";
import {ControllerStorageLib} from "../controller/ControllerStorageLib.sol";
import {BaseContextStorageLib} from "./BaseContextStorageLib.sol";

/// @title BaseContextUpgradablePackage
abstract contract BaseContextUpgradablePackage is
    BaseContext,
    UpgradablePackage,
    IContextPackageInitializationErrors
{
    /// @notice Initialize smart contract
    /// @param updatesRepository Updates repository address
    /// @param controller Controller of the contract
    function _initialize(
        string calldata name,
        string calldata description,
        address updatesRepository,
        address controller
    ) internal {
        // upgradability storage - EIP-7201
        UpgradabilityStorageLib.UpgradabilityStorage
            storage upgradabilityStorage = UpgradabilityStorageLib
                ._getUpgradabilityStorage();

        // base context storage - EIP-7201
        BaseContextStorageLib.BaseContextStorage
            storage baseContextStorage = BaseContextStorageLib
                ._getBaseContextStorage();

        if (updatesRepository == address(0)) {
            revert UpdatesRepositoryCannotBeZeroAddress();
        }
        if (msg.sender != upgradabilityStorage._initializationOwnerAddress) {
            revert OnlyInitializationOwnerAllowed();
        }

        delete upgradabilityStorage._initializationOwnerAddress;

        baseContextStorage._contextName = name;
        baseContextStorage._contextDescription = description;
        upgradabilityStorage._updatesRepositoryAddress = updatesRepository;
        ControllerStorageLib._getControllerStorage()._controller = controller;

        address package = upgradabilityStorage._methodsImplementations[msg.sig];
        _initializeMethods(package);
    }

    /// @notice Provides initialization of the component methods
    /// @param package Current package address
    function _initializeMethods(address package) internal virtual {
        // upgradability storage - EIP-7201
        UpgradabilityStorageLib.UpgradabilityStorage
            storage upgradabilityStorage = UpgradabilityStorageLib
                ._getUpgradabilityStorage();

        bytes4[] memory _funcSigs = new bytes4[](31);
        // IContext methods
        _funcSigs[0] = IContext.pause.selector;
        _funcSigs[1] = IContext.unpause.selector;
        _funcSigs[2] = IContext.updateContext.selector;
        _funcSigs[3] = IContext.paused.selector;
        _funcSigs[4] = IContext.contextName.selector;
        _funcSigs[5] = IContext.contextDescription.selector;
        // IController methods
        _funcSigs[6] = IController.transferControl.selector;
        _funcSigs[7] = IController.controller.selector;
        // IRoleAgency methods
        _funcSigs[8] = IRoleAgency.batchSetDefaultRoles.selector;
        _funcSigs[9] = IRoleAgency.canCallFunction.selector;
        _funcSigs[10] = IRoleAgency.addRoleContext.selector;
        _funcSigs[11] = IRoleAgency.removeRoleContext.selector;
        _funcSigs[12] = IRoleAgency.roleContext.selector;
        _funcSigs[13] = IRoleAgency.setDefaultRole.selector;
        _funcSigs[14] = IRoleAgency.removeDefaultRole.selector;
        _funcSigs[15] = IRoleAgency.overrideDefaultRole.selector;
        _funcSigs[16] = IRoleAgency.restoreDefaultRole.selector;
        _funcSigs[17] = IRoleAgency.setPublicAccess.selector;
        _funcSigs[18] = IRoleAgency.getDefaultRole.selector;
        _funcSigs[19] = IRoleAgency.getOverridenRole.selector;
        _funcSigs[20] = IRoleAgency.configureDefaultRoleForStrategy.selector;
        _funcSigs[21] = IRoleAgency.getDefaultRoleForStrategy.selector;
        // IDefaultRoleRegistrar methods
        _funcSigs[22] = IDefaultRoleRegistrar.registerDefaultRoles.selector;
        // IPackage methods
        _funcSigs[23] = IComponentIdGetter.getComponentId.selector;
        // IUpgradable methods
        _funcSigs[24] = IUpgradable.getCurrentVersion.selector;
        _funcSigs[25] = IUpgradable.getLatestVersion.selector;
        _funcSigs[26] = IUpgradable.update.selector;
        _funcSigs[27] = IUpgradable.updateToSpecificVersion.selector;
        _funcSigs[28] = IUpgradable.getPackageAddressForFunction.selector;
        _funcSigs[29] = IUpgradable.getFunctionSelectorsOfPackage.selector;
        _funcSigs[30] = IUpgradable.getPackagesUsedByCurrentComponent.selector;

        for (uint256 i; i < _funcSigs.length; ++i) {
            upgradabilityStorage._methodsImplementations[
                _funcSigs[i]
            ] = package;
            upgradabilityStorage._packageFunctionSelectors[package].push(
                _funcSigs[i]
            );
        }

        upgradabilityStorage._supportedInterfaces[
            type(IContext).interfaceId
        ] = true;
        upgradabilityStorage._supportedInterfaces[
            type(IUpgradable).interfaceId
        ] = true;
        upgradabilityStorage._supportedInterfaces[
            type(IPackage).interfaceId
        ] = true;
        upgradabilityStorage._supportedInterfaces[
            type(IDefaultRoleRegistrar).interfaceId
        ] = true;
        upgradabilityStorage._supportedInterfaces[
            type(IRoleAgency).interfaceId
        ] = true;
        upgradabilityStorage._supportedInterfaces[
            type(IController).interfaceId
        ] = true;
    }
}
