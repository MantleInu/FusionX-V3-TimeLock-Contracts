pragma solidity =0.7.6;

import "./interfaces/UniswapInterfaces.sol";

contract TimeLock is IERC721Receiver {

    event TokenLocked(address indexed locker, address token, uint256 id, uint256 releaseTime);
    event TokenReleased(address indexed locker, address token, uint256 id);

    struct Deposit {
        address owner;
        uint128 liquidity;
        address token0;
        address token1;
    }

    // Mapping of tokenId to Liqudity and token deposits.
    mapping(uint256 => Deposit) public deposits;
    // Mapping from token id to release time
    mapping (uint256 => uint256) public releaseTimes;

    // Public Address of V3 NFT
    address public nonFungiblePositionManagerAddress = 0x5752F085206AB87d8a5EF6166779658ADD455774;

    INonfungiblePositionManager public immutable nonfungiblePositionManager;

    constructor() {
        nonfungiblePositionManager =
            INonfungiblePositionManager(nonFungiblePositionManagerAddress);
    }

    /// @notice Locks V3 Liquidity NFT
    /// @param tokenId The id of the erc721 token
    /// @param releaseTime Unix Timestamp of when the token will be locked until
    function lockToken(uint256 tokenId, uint256 releaseTime) external {        
        require(releaseTime > block.timestamp, "Release time must be in the future.");
        // Check if token is held by msg.sender
        require(nonfungiblePositionManager.ownerOf(tokenId) == msg.sender, "Token must be owned by function caller.");
        // Check if token has been approved for transfer
        require(nonfungiblePositionManager.getApproved(tokenId) == address(this), "Token must be approved for transfer.");
        
        nonfungiblePositionManager.safeTransferFrom(msg.sender, address(this), tokenId);

        // Update mapping
        releaseTimes[tokenId] = releaseTime;

        emit TokenLocked(msg.sender, nonFungiblePositionManagerAddress, tokenId, releaseTime);
    }

    /// @notice Releases the lock token to owner once lock time has passed. 
    /// @param tokenId The id of the erc721 token
    function releaseToken(uint256 tokenId) external {
        require(block.timestamp >= releaseTimes[tokenId], "Cannot release token before release time.");
        address owner = deposits[tokenId].owner;

        require(owner == msg.sender, "Only the owner can release the token");

        nonfungiblePositionManager.safeTransferFrom(address(this), owner, tokenId);

        // Update mapping
        delete releaseTimes[tokenId];
        delete deposits[tokenId];

        emit TokenReleased(owner, nonFungiblePositionManagerAddress, tokenId);
    }

    /// @notice Collects the fees associated with provided liquidity
    /// @dev The contract must hold the erc721 token before it can collect fees
    /// @param tokenId The id of the erc721 token
    /// @return amount0 The amount of fees collected in token0
    /// @return amount1 The amount of fees collected in token1
    function collectAllFees(uint256 tokenId) external returns (uint256 amount0, uint256 amount1) {
        // Require that the contract holds the token
        require(nonfungiblePositionManager.ownerOf(tokenId) == address(this), 'Contract does not own token');

        // set amount0Max and amount1Max to uint256.max to collect all fees
        // alternatively can set recipient to msg.sender and avoid another transaction in `sendToOwner`
        INonfungiblePositionManager.CollectParams memory params =
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            });

        (amount0, amount1) = nonfungiblePositionManager.collect(params);

        // send collected fees back to owner
        _sendToOwner(tokenId, amount0, amount1);
    }

    /// @notice Check if token is locked for a tokenId
    /// @param tokenId The id of the erc721 token
    /// @return boolean of whether the tocken is still locked.
    function isTokenLocked(uint256 tokenId) external view returns (bool) {
        return block.timestamp < releaseTimes[tokenId];
    }

    ///@dev ERC721Receiver implementation
    function onERC721Received(
        address,
        address owner,
        uint256 tokenId,
        bytes calldata
    ) external override returns (bytes4) {
        // get position information

        _createDeposit(owner, tokenId);

        return this.onERC721Received.selector;
    }

    function _createDeposit(address owner, uint256 tokenId) internal {
        (, , address token0, address token1, , , , uint128 liquidity, , , , ) =
            nonfungiblePositionManager.positions(tokenId);

        // set the owner and data for position
        // operator is msg.sender
        deposits[tokenId] = Deposit({owner: owner, liquidity: liquidity, token0: token0, token1: token1});
    }


    /// @notice Transfers funds to owner of NFT
    /// @param tokenId The id of the erc721
    /// @param amount0 The amount of token0
    /// @param amount1 The amount of token1
    function _sendToOwner(
        uint256 tokenId,
        uint256 amount0,
        uint256 amount1
    ) internal {
        // get owner of contract
        address owner = deposits[tokenId].owner;

        address token0 = deposits[tokenId].token0;
        address token1 = deposits[tokenId].token1;
        // send collected fees to owner
        TransferHelper.safeTransfer(token0, owner, amount0);
        TransferHelper.safeTransfer(token1, owner, amount1);
    }
}