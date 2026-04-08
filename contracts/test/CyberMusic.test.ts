import { expect } from "chai";
import hre from "hardhat";

describe("CyberMusic", function () {
  async function deploy() {
    const [owner, user1, user2] = await hre.ethers.getSigners();
    const CyberMusic = await hre.ethers.getContractFactory("CyberMusic");
    const contract = await CyberMusic.deploy();
    return { contract, owner, user1, user2 };
  }

  describe("Minting", function () {
    it("should mint a song NFT", async function () {
      const { contract, user1 } = await deploy();
      const uri = "ipfs://QmTestHash123/metadata.json";

      await contract.connect(user1).mint(uri, 1);

      expect(await contract.uri(1)).to.equal(uri);
      expect(await contract.balanceOf(user1.address, 1)).to.equal(1);
      expect(await contract.minters(1)).to.equal(user1.address);
      expect(await contract.totalMinted()).to.equal(1);
    });

    it("should mint multiple copies", async function () {
      const { contract, user1 } = await deploy();

      await contract.connect(user1).mint("ipfs://QmTest456", 3);

      expect(await contract.balanceOf(user1.address, 1)).to.equal(3);
    });

    it("should reject quantity > 5", async function () {
      const { contract, user1 } = await deploy();

      await expect(
        contract.connect(user1).mint("ipfs://test", 6)
      ).to.be.revertedWith("Quantity must be 1-5");
    });

    it("should reject quantity 0", async function () {
      const { contract, user1 } = await deploy();

      await expect(
        contract.connect(user1).mint("ipfs://test", 0)
      ).to.be.revertedWith("Quantity must be 1-5");
    });

    it("should reject empty metadata URI", async function () {
      const { contract, user1 } = await deploy();

      await expect(
        contract.connect(user1).mint("", 1)
      ).to.be.revertedWith("Empty metadata URI");
    });

    it("should increment token IDs", async function () {
      const { contract, user1, user2 } = await deploy();

      await contract.connect(user1).mint("ipfs://song1", 1);
      await contract.connect(user2).mint("ipfs://song2", 2);

      expect(await contract.uri(1)).to.equal("ipfs://song1");
      expect(await contract.uri(2)).to.equal("ipfs://song2");
      expect(await contract.balanceOf(user1.address, 1)).to.equal(1);
      expect(await contract.balanceOf(user2.address, 2)).to.equal(2);
      expect(await contract.totalMinted()).to.equal(2);
    });

    it("should emit SongMinted event", async function () {
      const { contract, user1 } = await deploy();
      const uri = "ipfs://QmEventTest/metadata.json";

      await expect(contract.connect(user1).mint(uri, 2))
        .to.emit(contract, "SongMinted")
        .withArgs(1, user1.address, uri, 2);
    });
  });

  describe("URI", function () {
    it("should revert for non-existent token", async function () {
      const { contract } = await deploy();

      await expect(contract.uri(999)).to.be.revertedWith(
        "Token does not exist"
      );
    });
  });
});
