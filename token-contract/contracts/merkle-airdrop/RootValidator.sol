pragma solidity ^0.6.0;

import "./MerkleUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RootValidator is Ownable {
    bytes32 public rootHash;

    function setRoot(bytes32 merkleRoot) public onlyOwner {
        rootHash = merkleRoot;
    }

    function verifyDataInState(
        bytes memory data,
        bytes32[] memory nodes,
        uint256 leafIndex
    ) public view returns (bool) {
        return MerkleUtils.containedInTree(rootHash, data, nodes, leafIndex);
    }
}
