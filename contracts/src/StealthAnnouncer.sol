// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @notice ERC-5564 announcer. Canonical interface, kept verbatim so any
///         ERC-5564 client can read this chain without a custom adapter.
interface IERC5564Announcer {
    /// @param schemeId         id of the stealth address scheme. 1 is secp256k1
    ///                         with a view tag, which is what RhMask derives.
    /// @param stealthAddress   the one-time address the payment landed on.
    /// @param caller           whoever emitted the announcement.
    /// @param ephemeralPubKey  33-byte compressed ephemeral public key.
    /// @param metadata         view tag in byte 0, then anything the sender adds.
    event Announcement(
        uint256 indexed schemeId,
        address indexed stealthAddress,
        address indexed caller,
        bytes ephemeralPubKey,
        bytes metadata
    );

    function announce(
        uint256 schemeId,
        address stealthAddress,
        bytes memory ephemeralPubKey,
        bytes memory metadata
    ) external;
}

/**
 * @title StealthAnnouncer
 * @notice The only thing a stealth payment cannot do on its own is tell the
 *         recipient it happened. This contract is that channel: the sender
 *         emits one event, and the recipient finds it by filtering on the view
 *         tag in `metadata[0]` before doing any elliptic-curve work.
 *
 *         It holds no state, takes no custody, and has no owner. It cannot be
 *         paused, upgraded, or made to lie: an announcement is just a log.
 *         Announcements are unauthenticated by design, exactly as ERC-5564
 *         specifies. A false one costs the sender gas and tells the recipient
 *         nothing, because the recipient only believes an announcement their
 *         own viewing key can reproduce.
 */
contract StealthAnnouncer is IERC5564Announcer {
    /// @inheritdoc IERC5564Announcer
    function announce(
        uint256 schemeId,
        address stealthAddress,
        bytes memory ephemeralPubKey,
        bytes memory metadata
    ) external override {
        emit Announcement(schemeId, stealthAddress, msg.sender, ephemeralPubKey, metadata);
    }
}
