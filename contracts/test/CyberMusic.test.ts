import { expect } from "chai";
import hre from "hardhat";

describe("CyberMusic", function () {
  async function deploy() {
    const [owner, user1, user2, user3] = await hre.ethers.getSigners();
    const CyberMusic = await hre.ethers.getContractFactory("CyberMusic");
    const contract = await CyberMusic.deploy();
    return { contract, owner, user1, user2, user3 };
  }

  describe("Minting", function () {
    it("mints a song NFT", async function () {
      const { contract, user1 } = await deploy();
      const uri = "ipfs://QmTestHash123/metadata.json";

      await contract.connect(user1).mint(uri, 1);

      expect(await contract.uri(1)).to.equal(uri);
      expect(await contract.balanceOf(user1.address, 1)).to.equal(1);
      expect(await contract.minters(1)).to.equal(user1.address);
      expect(await contract.totalMinted()).to.equal(1);
    });

    it("mints multiple copies", async function () {
      const { contract, user1 } = await deploy();

      await contract.connect(user1).mint("ipfs://QmTest456", 3);

      expect(await contract.balanceOf(user1.address, 1)).to.equal(3);
    });

    it("rejects quantity > 5", async function () {
      const { contract, user1 } = await deploy();

      await expect(
        contract.connect(user1).mint("ipfs://test", 6)
      ).to.be.revertedWith("Quantity must be 1-5");
    });

    it("rejects quantity 0", async function () {
      const { contract, user1 } = await deploy();

      await expect(
        contract.connect(user1).mint("ipfs://test", 0)
      ).to.be.revertedWith("Quantity must be 1-5");
    });

    it("rejects empty metadata URI", async function () {
      const { contract, user1 } = await deploy();

      await expect(
        contract.connect(user1).mint("", 1)
      ).to.be.revertedWith("Empty metadata URI");
    });

    it("accepts all valid quantities 1..5", async function () {
      for (const q of [1, 2, 3, 4, 5]) {
        const { contract, user1 } = await deploy();
        await expect(contract.connect(user1).mint("ipfs://q", q)).to.not.be.reverted;
        expect(await contract.balanceOf(user1.address, 1)).to.equal(q);
      }
    });

    it("increments token IDs across distinct minters", async function () {
      const { contract, user1, user2 } = await deploy();

      await contract.connect(user1).mint("ipfs://song1", 1);
      await contract.connect(user2).mint("ipfs://song2", 2);

      expect(await contract.uri(1)).to.equal("ipfs://song1");
      expect(await contract.uri(2)).to.equal("ipfs://song2");
      expect(await contract.balanceOf(user1.address, 1)).to.equal(1);
      expect(await contract.balanceOf(user2.address, 2)).to.equal(2);
      expect(await contract.minters(1)).to.equal(user1.address);
      expect(await contract.minters(2)).to.equal(user2.address);
      expect(await contract.totalMinted()).to.equal(2);
    });

    it("tracks totalMinted across many sequential mints", async function () {
      const { contract, user1 } = await deploy();
      for (let i = 0; i < 10; i++) {
        await contract.connect(user1).mint(`ipfs://sequential/${i}`, 1);
      }
      expect(await contract.totalMinted()).to.equal(10);
      expect(await contract.uri(7)).to.equal("ipfs://sequential/6");
    });

    it("returns the new tokenId to the caller", async function () {
      const { contract, user1 } = await deploy();
      // staticCall: simulate without state change
      const returnedId = await contract
        .connect(user1)
        .mint.staticCall("ipfs://return", 1);
      expect(returnedId).to.equal(1);

      await contract.connect(user1).mint("ipfs://return", 1);

      const next = await contract
        .connect(user1)
        .mint.staticCall("ipfs://return2", 1);
      expect(next).to.equal(2);
    });

    it("emits SongMinted event with correct args", async function () {
      const { contract, user1 } = await deploy();
      const uri = "ipfs://QmEventTest/metadata.json";

      await expect(contract.connect(user1).mint(uri, 2))
        .to.emit(contract, "SongMinted")
        .withArgs(1, user1.address, uri, 2);
    });

    it("emits ERC1155 TransferSingle from zero address on mint", async function () {
      const { contract, user1 } = await deploy();
      await expect(contract.connect(user1).mint("ipfs://single", 4))
        .to.emit(contract, "TransferSingle")
        .withArgs(
          user1.address,
          hre.ethers.ZeroAddress,
          user1.address,
          1,
          4
        );
    });
  });

  describe("URI", function () {
    it("reverts for non-existent token", async function () {
      const { contract } = await deploy();

      await expect(contract.uri(999)).to.be.revertedWith(
        "Token does not exist"
      );
    });

    it("reverts for tokenId 0 (counter starts at 1)", async function () {
      const { contract } = await deploy();
      await expect(contract.uri(0)).to.be.revertedWith("Token does not exist");
    });

    it("stores distinct URIs per token", async function () {
      const { contract, user1 } = await deploy();
      await contract.connect(user1).mint("ipfs://a", 1);
      await contract.connect(user1).mint("ipfs://b", 1);
      expect(await contract.uri(1)).to.equal("ipfs://a");
      expect(await contract.uri(2)).to.equal("ipfs://b");
    });
  });

  describe("Transfers (ERC1155)", function () {
    it("minter can transfer copies to another address", async function () {
      const { contract, user1, user2 } = await deploy();
      await contract.connect(user1).mint("ipfs://transfer", 5);

      await contract
        .connect(user1)
        .safeTransferFrom(user1.address, user2.address, 1, 2, "0x");

      expect(await contract.balanceOf(user1.address, 1)).to.equal(3);
      expect(await contract.balanceOf(user2.address, 1)).to.equal(2);
    });

    it("rejects transfer without approval from non-owner", async function () {
      const { contract, user1, user2, user3 } = await deploy();
      await contract.connect(user1).mint("ipfs://noapprove", 5);

      await expect(
        contract
          .connect(user3)
          .safeTransferFrom(user1.address, user2.address, 1, 1, "0x")
      ).to.be.reverted;
    });

    it("preserves minters mapping after transfer", async function () {
      const { contract, user1, user2 } = await deploy();
      await contract.connect(user1).mint("ipfs://preserve", 3);

      await contract
        .connect(user1)
        .safeTransferFrom(user1.address, user2.address, 1, 3, "0x");

      expect(await contract.balanceOf(user1.address, 1)).to.equal(0);
      expect(await contract.balanceOf(user2.address, 1)).to.equal(3);
      expect(await contract.minters(1)).to.equal(user1.address);
    });

    it("supports balanceOfBatch across tokens and addresses", async function () {
      const { contract, user1, user2 } = await deploy();
      await contract.connect(user1).mint("ipfs://batch1", 2);
      await contract.connect(user2).mint("ipfs://batch2", 3);

      const balances = await contract.balanceOfBatch(
        [user1.address, user2.address, user1.address],
        [1, 2, 2]
      );
      expect(balances[0]).to.equal(2);
      expect(balances[1]).to.equal(3);
      expect(balances[2]).to.equal(0);
    });
  });

  describe("Ownership", function () {
    it("deployer is owner", async function () {
      const { contract, owner } = await deploy();
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("minting does not require ownership — anyone can mint", async function () {
      const { contract, user1, user2, user3 } = await deploy();
      await expect(contract.connect(user1).mint("ipfs://u1", 1)).to.not.be.reverted;
      await expect(contract.connect(user2).mint("ipfs://u2", 1)).to.not.be.reverted;
      await expect(contract.connect(user3).mint("ipfs://u3", 1)).to.not.be.reverted;
    });
  });
});
