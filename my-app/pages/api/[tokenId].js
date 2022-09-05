export default function handler(req, res) {
  // 从查询参数中获取 tokenId
  const tokenId = req.query.tokenId;
  // 由于所有图片都是在github上上传的，我们可以直接从github中提取图片。
  const image_url =
    "https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/";
  // api 正在为 Crypto Dev 发回元数据
  // 为了使我们的集合与 Opensea 兼容，我们需要遵循一些元数据标准
  // 当从 api 发回响应时
  // 更多信息可以在这里找到：https://docs.opensea.io/docs/metadata-standards
  res.status(200).json({
    name: "Crypto Dev #" + tokenId,
    description: "Crypto Dev is a collection of developers in crypto",
    image: image_url + tokenId + ".svg",
  });
}
