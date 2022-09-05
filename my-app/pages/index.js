import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  // walletConnected 跟踪用户的钱包是否连接
  const [walletConnected, setWalletConnected] = useState(false);
  // presaleStarted 跟踪预售是否已经开始
  const [presaleStarted, setPresaleStarted] = useState(false);
  // presaleEnded 跟踪预售是否结束
  const [presaleEnded, setPresaleEnded] = useState(false);
  // 当我们等待交易被挖掘时，loading 设置为 true
  const [loading, setLoading] = useState(false);
  // 检查当前连接的 MetaMask 钱包是否是合约的所有者
  const [isOwner, setIsOwner] = useState(false);
  // tokenIdsMinted 跟踪已铸造的 tokenId 数量
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  // 创建对 Web3 模态（用于连接到 Metamask）的引用，只要页面打开，它就会持续存在
  const web3ModalRef = useRef();

  /**
   * presaleMint：在预售期间铸造 NFT
   */
  const presaleMint = async () => {
    try {
      // 我们需要一个签名者，因为这是一个“写入”交易。
      const signer = await getProviderOrSigner(true);
      // 创建一个带有签名者的合约的新实例，它允许更新方法
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // 从合约中调用 presaleMint，只有列入白名单的地址才能铸币
      const tx = await whitelistContract.presaleMint({
        // value 表示一个加密开发者的成本，即“0.01”eth。
        // 我们正在使用来自 ethers.js
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // 等待交易被挖掘
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * publicMint: 在预售后铸币 NFT
   */
  const publicMint = async () => {
    try {
      // 我们需要一个签名者，因为这是一个“写”交易。
      const signer = await getProviderOrSigner(true);
      // 创建一个带有签名者的合约的新实例，它允许更新方法
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // 从合约调用铸币厂来铸币加密货币开发者
      const tx = await whitelistContract.mint({
        // value 表示一个加密货币开发者的成本，即“0.01”eth。
        // 我们正在使用来自 ethers.js 的 utils 库将 `0.01` 字符串解析为 ether
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // 等待交易被挖掘
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  };

  /*
      connectWallet: 连接 MetaMask 钱包
    */
  const connectWallet = async () => {
    try {
      // 从 web3Modal 获取提供者，在我们的例子中是 MetaMask
      // 第一次使用时提示用户连接他们的钱包
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * startPresale：开始 NFT 集合的预售
   */
  const startPresale = async () => {
    try {
      // 我们需要一个签名者，因为这是一个“写”交易。
      const signer = await getProviderOrSigner(true);
      // 创建一个带有签名者的合约的新实例，它允许更新方法
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // 从合约调用 startPresale
      const tx = await whitelistContract.startPresale();
      setLoading(true);
      // 等待交易被挖掘
      await tx.wait();
      setLoading(false);
      // 设置预售开始为真
      await checkIfPresaleStarted();
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * checkIfPresaleStarted：通过查询合约中的 `presaleStarted`
   * 变量来检查预售是否已经开始
   */
  const checkIfPresaleStarted = async () => {
    try {
      // 从 web3Modal 获取提供者，在我们的例子中是 MetaMask
      // 这里不需要签名者，因为我们只是从区块链中读取状态
      const provider = await getProviderOrSigner();
      // 我们使用提供者连接到合约，所以我们将只有
      // 对合约拥有只读权限
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // 从合约中调用 presaleStarted
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /**
   * checkIfPresaleEnded: 通过查询合约中的 `presaleEnded`
   * 变量检查预售是否结束
   */
  const checkIfPresaleEnded = async () => {
    try {
      // 从 web3Modal 获取提供者，在我们的例子中是 MetaMask
      // 这里不需要签名者，因为我们只是从区块链中读取状态
      const provider = await getProviderOrSigner();
      // 我们使用提供者连接到合约，所以我们将只有
      // 对合约拥有只读权限
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // 从合约中调用 presaleEnded
      const _presaleEnded = await nftContract.presaleEnded();
      // _presaleEnded 是一个大数字，所以我们使用 lt(小于函数) 而不是 `<`
      // Date.now()/1000 返回当前时间（以秒为单位）
      // 我们比较 _presaleEnded 时间戳是否小于当前时间
      // 这意味着预售已经结束
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /**
   * getOwner: 调用合约来获取所有者
   */
  const getOwner = async () => {
    try {
      // 从 web3Modal 获取提供者，在我们的例子中是 MetaMask
      // 这里不需要签名者，因为我们只是从区块链中读取状态
      const provider = await getProviderOrSigner();
      // 我们使用提供者连接到合约，所以我们将只有
      // 对合约拥有只读权限
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // 从合约中调用 owner 函数
      const _owner = await nftContract.owner();
      // 我们现在将获取签名者以提取当前连接的 MetaMask 帐户的地址
      const signer = await getProviderOrSigner(true);
      // 获取与 MetaMask 连接的签名者关联的地址
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  /**
   * getTokenIdsMinted: 获取已铸造的 tokenId 数量
   */
  const getTokenIdsMinted = async () => {
    try {
      // 从 web3Modal 获取提供者，在我们的例子中是 MetaMask
      // 这里不需要签名者，因为我们只是从区块链中读取状态
      const provider = await getProviderOrSigner();
      // 我们使用提供者连接到合约，所以我们将只有
      // 对合约拥有只读权限
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // 从合约中调用 tokenIds
      const _tokenIds = await nftContract.tokenIds();
      //_tokenIds 是一个“BigNumber”。我们需要将 Big Number 转换为字符串
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * 返回代表以太坊 RPC 的 Provider 或 Signer 对象，带有或不带有
   * 附加元掩码的签名功能
   *
   * 需要一个 `Provider` 来与区块链交互 - 读取交易、读取余额、读取状态等
   *
   * `Signer` 是一种特殊类型的 Provider，用于在需要对区块链进行`write` 交易的情况下，这涉及到连接的帐户
   * 需要进行数字签名以授权正在发送的交易。Metamask 公开了一个 Signer API 以允许您的网站
   * 使用 Signer 函数向用户请求签名。
   *
   * @param {*} needSigner - 如果需要签名者则为真，否则默认为假
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // 连接到 Metamask
    // 因为我们存储 `web3Modal` 作为参考，我们需要访问 `current` 值来访问底层对象
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // 如果用户没有连接到 Rinkeby 网络，让他们知道并抛出错误
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // useEffects 用于对网站状态的变化做出反应
  // 函数调用末尾的数组表示什么状态变化会触发这个效果
  // 在这种情况下，只要 `walletConnected` 的值发生变化 - 这个效果就会被称为
  useEffect(() => {
    // 如果钱包没有连接，则创建一个新的 Web3Modal 实例并连接 MetaMask 钱包
    if (!walletConnected) {
      // 通过将 Web3Modal 类设置为 `current` 将其分配给引用对象value
      // 只要此页面打开，`current` 值就会一直保持
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      // 检查预售是否已经开始和结束
      const _presaleStarted = checkIfPresaleStarted();
      if (_presaleStarted) {
        checkIfPresaleEnded();
      }

      getTokenIdsMinted();

      // 设置每 5 秒调用一次的时间间隔，以检查预售是否结束
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);

      // 设置间隔以获取每 5 秒生成的令牌 Id 的数量
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  /*
      renderButton: 根据 dapp 的状态返回一个按钮
    */
  const renderButton = () => {
    // 如果钱包没有连接，返回一个允许他们连接钱包的按钮
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    // 如果我们当前正在等待某些东西，返回一个加载按钮
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    // 如果连接的用户是所有者，并且预售还没有开始，允许他们开始预售
    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale!
        </button>
      );
    }

    // 如果连接的用户不是所有者但预售还没有开始，告诉他们
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>Presale hasnt started!</div>
        </div>
      );
    }

    // 如果预售开始，但尚未结束，允许在预售期间进行铸币
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a
            Crypto Dev 🥳
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    // 如果预售开始并结束，则公开铸币的时间
    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint 🚀
        </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}