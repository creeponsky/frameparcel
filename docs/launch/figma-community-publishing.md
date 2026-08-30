# FrameParcel 上架 Figma Community：实际操作清单

这不是在浏览器版 Tools 页面里完成的。Figma 的经典插件开发与发布入口只在 macOS / Windows 的 Figma Desktop 中；浏览器版里看到的 **Create → Plugin** 是另一套创建入口，不会出现本地 manifest 的完整开发菜单。

官方说明：<https://help.figma.com/hc/en-us/articles/360042293394-Publish-plugins-to-the-Figma-Community>

## 上架前只需要准备一次

1. 安装并登录 Figma Desktop。
2. 给发布账号开启两步验证（2FA）。
3. 在任意 Figma Design 文件里通过开发插件入口导入本仓库的 `manifest.json`，确认列表中能看到 FrameParcel。
4. 用真实设计文件分别测试：单选、多选、当前 Page、开发包、视觉评审包、完整归档包。
5. 对真实导出的 ZIP 执行 `npm run validate-export -- /绝对路径/导出包.zip`。
6. 准备公开支持地址和隐私政策：
   - Support: <https://github.com/creeponsky/frameparcel/issues>
   - Privacy: <https://github.com/creeponsky/frameparcel/blob/main/PRIVACY.md>

## 在 Figma Desktop 里从哪里进入

按当前官方路径：

1. 打开任意 Figma Design 文件。
2. 点击左上角 Figma 菜单。
3. 进入 **Plugins → Manage plugins**。
4. 找到开发中的 FrameParcel，点击右侧菜单，选择 **Publish**。

如果当前界面没有显示这条路径，还可以从 Figma Desktop 的 Community 页面进入：右上角 **Publish → Plugins**，然后选择 FrameParcel。不要在浏览器版的 Tools 页面继续找 “Import plugin from manifest”。

## 发布表单怎么填

### Describe your resource

- Name: `FrameParcel`
- Tagline: `Export Figma context into a local package any coding agent can inspect.`
- Category: `Software development`
- Description: 复制 [`docs/community-listing.md`](../community-listing.md) 中的英文 Full description。
- Tags: `developer handoff`, `AI`, `export`, `assets`, `local-first`

### Choose some images

- Icon: `docs/community-assets/icon.png`（128×128）
- Thumbnail: `docs/community-assets/thumbnail.png`（1920×1080）
- Carousel 1: `carousel-01-scopes.png`
- Carousel 2: `carousel-02-package.png`
- Carousel 3: `carousel-03-private.png`

Figma 当前允许最多九张轮播图片或视频。第一版只用三张，信息已经足够，不需要为了填满而重复。

### Data security

按实际实现填写：

- Network access: `No access to network`
- Accounts: none
- Analytics / telemetry: none
- External storage: none
- Data handling: design data only leaves Figma through the ZIP download explicitly triggered by the user

`manifest.json` 已把 `networkAccess.allowedDomains` 设置为 `none`，表单中的声明必须和代码保持一致。

### Final details

- Publish to: `Community`
- Publisher: 选择你的个人 Community profile，除非你明确要用团队身份发布。
- Support contact: GitHub Issues URL，或者你愿意公开接收支持请求的邮箱。
- Comments: 第一版建议开启，便于收集真实导出问题。
- Pricing: 第一版免费。插件本身没有服务器成本，也更适合先验证真实需求。

## 提交后会发生什么

首次提交会进入 Figma 审核。官方目标是 5–10 个工作日，复杂情况可能接近两周；审核期间仍可更新插件。审核结果会发到 Figma 账号邮箱。

## 我可以帮你做到哪一步

我可以继续完成代码、构建文件、商店文案、图片、发布说明、测试清单，也可以在你已经登录的 Figma Desktop 中协助打开发布表单并逐项填写。

以下步骤必须由账号所有者参与或在操作前给出明确的最终确认：

- 2FA、验证码或账号身份确认；
- 选择最终发布身份和公开支持联系方式；
- 勾选发布者声明；
- 点击最终 **Publish / Submit for review**。

这是公开发布和代表你对外声明，不应该在没有最后确认时自动提交。

## 最终发布门槛

- [ ] Figma Desktop Light Mode 实测
- [ ] Figma Desktop Dark Mode 实测
- [ ] 中文与 English 切换并重开插件，偏好保持正确
- [ ] 单选、多选、Page 三种范围各导出一次
- [ ] 三种 preset 各导出一次
- [ ] 真实 ZIP 结构校验通过
- [ ] 真实 `index.html` 离线打开通过
- [ ] 图标在 16、32、128 px 下可辨认
- [ ] 1920×1080 封面和三张轮播没有裁切、错字或品牌误导
- [ ] GitHub `main`、release tag 和 Community 上传的 `dist/` 来自同一提交
- [ ] 发布身份、支持联系方式和最终提交已由账号所有者确认
