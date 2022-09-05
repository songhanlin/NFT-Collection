// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {
    /**
     * @dev _baseTokenURI 用于计算 {tokenURI}。如果设置，每个
     * 令牌的结果 URI 将是 `baseURI` 和 `tokenId` 的串联。
     */
    string _baseTokenURI;

    //  _price 是一个 Crypto Dev NFT 的价格
    uint256 public _price = 0.01 ether;

    // _paused 用于在紧急情况下暂停合约
    bool public _paused;

    // CryptoDev 的最大数量
    uint256 public maxTokenIds = 20;

    // 铸造的 tokenIds 总数
    uint256 public tokenIds;

    // 白名单合约实例
    IWhitelist whitelist;

    // 布尔值，用于跟踪预售是否开始
    bool public presaleStarted;

    // 预售结束时间的时间戳
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused {
        require(!_paused, "Contract currently paused");
        _;
    }

    /**
     * @dev ERC721 构造函数接受一个 `name` 和一个 `symbol` 到令牌集合。
     * 在我们的例子中，名称是“Crypto Devs”，符号是“CD”。
     * Crypto Devs 的构造函数接受 baseURI 来为集合设置 _baseTokenURI。
     * 它还初始化一个白名单接口的实例。
     */
    constructor (string memory baseURI, address whitelistContract) ERC721("Crypto Devs", "CD") {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    /**
     * @dev startPresale 开始预售白名单地址
     */
    function startPresale() public onlyOwner {
        presaleStarted = true;
        // 将 presaleEnded 时间设置为当前时间戳 + 5 分钟
        // Solidity 有很酷的时间戳语法（秒、分钟、小时、天、年）
        presaleEnded = block.timestamp + 5 minutes;
    }

    /**
     * @dev presaleMint 允许用户在预售期间为每笔交易铸造一个 NFT。
     */
    function presaleMint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp < presaleEnded, "Presale is not running");
        require(whitelist.whitelistedAddresses(msg.sender), "You are not whitelisted");
        require(tokenIds < maxTokenIds, "Exceeded maximum Crypto Devs supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;
        // _safeMint 是 _mint 函数的更安全版本，因为它确保
        // 如果要铸造的地址是合约，那么它知道如何处理 ERC721 代币
        // 如果要铸造的地址不是合约，它的工作方式与 _mint
        _safeMint(msg.sender, tokenIds);
    }

    /**
     * @dev mint 允许用户在预售结束后为每笔交易铸造 1 个 NFT。
     */
    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp >=  presaleEnded, "Presale has not ended yet");
        require(tokenIds < maxTokenIds, "Exceed maximum Crypto Devs supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    /**
     * @dev _baseURI 覆盖 Openzeppelin 的 ERC721 实现，默认情况下
     * 返回 baseURI 的空字符串
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev setPaused 使合约暂停或取消暂停
     */
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }

    /**
     * @dev 将合约中的所有以太币 * 发送给合约的所有者
     */
    function withdraw() public onlyOwner  {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) =  _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    // 接收以太币的函数。msg.data 必须为空
    receive() external payable {}

    // 当 msg.data 不为空时调用 fallback 函数
    fallback() external payable {}
}