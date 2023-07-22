const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { latest } = require("@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time");

describe("TimeLock", function () {
    let deployer, MyToken, myToken, TimeLock, timeLock, timeLockAddress, myTokenAddress;

    beforeEach(async function () {
    [deployer] = await ethers.getSigners();

    MyToken = await ethers.getContractFactory("MyNFT");
    myToken = await MyToken.deploy();

    myTokenAddress = await myToken.getAddress();

    TimeLock = await ethers.getContractFactory("TimeLock");
    timeLock = await TimeLock.deploy(myTokenAddress);

    timeLockAddress = await timeLock.getAddress();
    });


  it("Happy path, lock NFT for defined period of time", async function () {
    
    const tokenId = 1;

    // Mint a new token
    await myToken.mint(deployer.address, tokenId);

    // Assert that the token is owned by the deployer
    expect(await myToken.ownerOf(tokenId)).to.equal(deployer.address);

    // Assert token is not time locked
    expect(await timeLock.isTokenLocked(tokenId)).to.equal(false);

    expect(await myToken.getApproved(tokenId)).to.not.equal(timeLockAddress);

    // Approve time lock to transfer token
    await myToken.approve(timeLockAddress, tokenId);

    // Check token approval for time lock
    expect(await myToken.getApproved(tokenId)).to.equal(timeLockAddress);

    // Lock the token
    var latest = await time.latest();
    var releaseTime = latest + time.duration.minutes(100);

    expect(await timeLock.lockToken(myTokenAddress, tokenId, releaseTime))
        .to.emit(timeLock, "TokenLocked")
        .withArgs(deployer.address, myTokenAddress, tokenId, releaseTime);

    // Check token owner to be time lock
    expect(await myToken.ownerOf(tokenId)).to.equal(timeLockAddress);

    // Try to release before time, should fail
    await expect(timeLock.releaseToken(tokenId))
      .to.be.revertedWith("Cannot release token before release time.");

    // Move time forward
    await time.increase(time.duration.minutes(110));

    // Release the token and expect event emitted with     event Released(address indexed user, address token, uint256 id);
    expect(await timeLock.releaseToken(tokenId))
        .to.emit(timeLock, "TokenReleased")
        .withArgs(deployer.address, myTokenAddress, tokenId);

    // Assert that the token is owned by the deployer
    expect(await myToken.ownerOf(tokenId)).to.equal(deployer.address);

  });
  it("Edge Path, Token already locked", async function () {
    // Mint token
    const tokenId = 1;

    // Mint a new token
    await myToken.mint(deployer.address, tokenId);

    // Approve time lock to transfer token
    await myToken.approve(timeLockAddress, tokenId);

    // Lock the token
    var latest = await time.latest();
    var releaseTime = latest + time.duration.minutes(100);
    await timeLock.lockToken(myTokenAddress, tokenId, releaseTime);

    // Expect revert when trying to lock token
    await expect(timeLock.lockToken(myTokenAddress, tokenId, releaseTime)).to.be.revertedWith("Token must not be locked.");
    });

  it("Edge Path, Token not approved for transfer to TimeLock", async function () {
    // Mint token
    const tokenId = 1;

    // Mint a new token
    await myToken.mint(deployer.address, tokenId);

    // Lock the token
    var latest = await time.latest();
    var releaseTime = latest + time.duration.minutes(100);
    
    // Expect revert when trying to lock token
    await expect(timeLock.lockToken(myTokenAddress, tokenId, releaseTime)).to.be.revertedWith("Token must be approved for transfer.");
  });
});