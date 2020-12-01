pragma solidity ^0.6.0;

import "./RootValidator.sol";
import "./ConvertUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract MerkleAirDrop is RootValidator {
    using SafeMath for uint256;

    mapping(address => uint256) public claimedTokensPerUser;

    IERC20 public tokenContract;
    address public tokenDistributor;

    constructor(address _tokenContract, address _tokenDistributor) public {
        require(_tokenDistributor != address(0));
        tokenContract = IERC20(_tokenContract);
        tokenDistributor = _tokenDistributor;
    }

    function claim(
        address userAddress,
        uint256 totalTokenAmount,
        bytes32[] memory nodes,
        uint256 leafIndex
    ) public {
        bytes memory data = ConvertUtils.addressToBytesString(
            address(userAddress)
        );

        require(
            verifyDataInState(
                abi.encodePacked(
                    data,
                    ":",
                    ConvertUtils.uintToBytesString(totalTokenAmount)
                ),
                nodes,
                leafIndex
            ),
            "Data not contained"
        );

        uint256 tokensToMint = totalTokenAmount.sub(
            claimedTokensPerUser[userAddress]
        );

        tokenContract.transferFrom(tokenDistributor, userAddress, tokensToMint);
        claimedTokensPerUser[userAddress] = totalTokenAmount;
    }

    function isInState(
        address userAddress,
        uint256 totalTokenAmount,
        bytes32[] memory nodes,
        uint256 leafIndex
    ) public view returns (bool) {
        bytes memory data = ConvertUtils.addressToBytesString(
            address(userAddress)
        );
        return
            verifyDataInState(
                abi.encodePacked(
                    data,
                    ":",
                    ConvertUtils.uintToBytesString(totalTokenAmount)
                ),
                nodes,
                leafIndex
            );
    }
}
