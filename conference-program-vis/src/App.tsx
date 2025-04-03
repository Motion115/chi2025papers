import React from "react";
import { ConfigProvider, Layout, Typography } from "antd";
import Dashboard from "./Dashboard";
import THEME from "./style/theme";
import { CSSBasicPageConfig, CSSPageConfig } from "./style/styleConfigs";
import { TwitterOutlined } from "@ant-design/icons";

const { Header, Content, Footer } = Layout;
const { Text, Title, Paragraph, Link } = Typography;

const App: React.FC = () => {
  return (
    <>
      <ConfigProvider theme={THEME}>
        <div>
          <Header style={{ padding: "0% 2% 0% 2%" }}>
            <Title level={2}>CHI 2025 Papers Explorer</Title>
          </Header>
          <Content style={CSSPageConfig}>
            <Dashboard />
          </Content>
          <Footer style={CSSPageConfig}>
            <Paragraph type="secondary">
              Made with ❤️ by{" "}
              <Link href="https://motion115.github.io" target="_blank">
                Ruishi (Ray) Zou
              </Link>
              . For questions, suggestions and comments, please reach out to{" "}
              <Link href="https://x.com/_ray_zou" target="_blank">
                @_ray_zou <TwitterOutlined />
              </Link>{" "}
              in X, or{" "}
              <Link
                href="https://bsky.app/profile/ray-zou.bsky.social"
                target="_blank"
              >
                @ray-zou.bsky.social
              </Link>{" "}
              in Bluesky. Inspired by Professor Guerra Gomez's{" "}
              <Link
                href="https://johnguerra.co/viz/chi2024Papers/"
                target="_blank"
              >
                CHI 2024 Paper Explorer project
              </Link>
              .
            </Paragraph>
            <Paragraph type="secondary">
              This project is a research prototype licensed under{" "}
              <Link
                href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                target="_blank"
              >
                CC BY-NA-SA 4.0
              </Link>
              . The input data is sourced from the{" "}
              <Link href="https://programs.sigchi.org/chi/2025" target="_blank">
                the official CHI 2025 programs site
              </Link>{" "}
              available under CC BY-NC-SA 4.0 (data used for this project
              retrieved March 29, 2025). All derived data and original source
              code in this repository are shared under the same license (CC
              BY-NC-SA 4.0). The source code and the encoded data of this
              project can be found in this{" "}
              <Link
                href="https://github.com/motion115/chi2025papers"
                target="_blank"
              >
                GitHub repo
              </Link>
              .
            </Paragraph>
          </Footer>
        </div>
      </ConfigProvider>
    </>
  );
};

export default App;
