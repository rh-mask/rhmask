// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @notice ERC-6538 stealth meta-address registry. Canonical interface.
interface IERC6538Registry {
    event StealthMetaAddressSet(
        address indexed registrant,
        uint256 indexed schemeId,
        bytes stealthMetaAddress
    );

    function registerKeys(uint256 schemeId, bytes calldata stealthMetaAddress) external;

    function stealthMetaAddressOf(address registrant, uint256 schemeId)
        external
        view
        returns (bytes memory);
}

/**
 * @title StealthRegistry
 * @notice Lets someone publish their stealth meta-address once, against an
 *         address a payer already knows. Without it a payer has to be handed
 *         132 hex characters out of band every time.
 *
 *         Only `msg.sender` can write its own entry. There is no owner, no
 *         pause and no upgrade path, so nobody can rewrite or censor a
 *         registration, including us. Registering is optional: the meta-address
 *         works perfectly well passed by QR, and this contract exists only to
 *         make it lookup-able.
 *
 * @dev Publishing a meta-address deliberately links it to the registering
 *      address. That is the point of a public directory, and it is why the app
 *      treats registration as opt-in rather than part of key generation. The
 *      addresses derived from it stay unlinkable either way.
 */
contract StealthRegistry is IERC6538Registry {
    /// registrant => schemeId => meta-address
    mapping(address => mapping(uint256 => bytes)) private _metaAddresses;

    error EmptyMetaAddress();

    /// @inheritdoc IERC6538Registry
    function registerKeys(uint256 schemeId, bytes calldata stealthMetaAddress) external override {
        if (stealthMetaAddress.length == 0) revert EmptyMetaAddress();
        _metaAddresses[msg.sender][schemeId] = stealthMetaAddress;
        emit StealthMetaAddressSet(msg.sender, schemeId, stealthMetaAddress);
    }

    /// @inheritdoc IERC6538Registry
    function stealthMetaAddressOf(address registrant, uint256 schemeId)
        external
        view
        override
        returns (bytes memory)
    {
        return _metaAddresses[registrant][schemeId];
    }
}
