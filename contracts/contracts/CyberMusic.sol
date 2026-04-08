// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CyberMusic is ERC1155, Ownable {
    uint256 private _tokenCounter;

    // tokenId => metadata URI (IPFS)
    mapping(uint256 => string) private _tokenUris;

    // tokenId => minter address
    mapping(uint256 => address) public minters;

    event SongMinted(
        uint256 indexed tokenId,
        address indexed minter,
        string metadataUri,
        uint256 quantity
    );

    constructor() ERC1155("") Ownable(msg.sender) {}

    /// @notice Mint a song as an NFT. Anyone can mint.
    /// @param metadataUri IPFS URI to the song metadata JSON
    /// @param quantity Number of copies to mint (max 5)
    function mint(
        string calldata metadataUri,
        uint256 quantity
    ) external returns (uint256) {
        require(quantity > 0 && quantity <= 5, "Quantity must be 1-5");
        require(bytes(metadataUri).length > 0, "Empty metadata URI");

        _tokenCounter++;
        uint256 tokenId = _tokenCounter;

        _tokenUris[tokenId] = metadataUri;
        minters[tokenId] = msg.sender;

        _mint(msg.sender, tokenId, quantity, "");

        emit SongMinted(tokenId, msg.sender, metadataUri, quantity);
        return tokenId;
    }

    /// @notice Returns the metadata URI for a token
    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory tokenUri = _tokenUris[tokenId];
        require(bytes(tokenUri).length > 0, "Token does not exist");
        return tokenUri;
    }

    /// @notice Returns the total number of tokens minted
    function totalMinted() external view returns (uint256) {
        return _tokenCounter;
    }
}
