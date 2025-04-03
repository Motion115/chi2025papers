import React from "react";
import { ConfigProvider, Layout, Typography } from "antd";
import Dashboard from "./Dashboard";
import THEME from "./style/theme";
import { CSSBasicPageConfig, CSSPageConfig } from "./style/styleConfigs";

const { Header, Content, Footer } = Layout;
const { Text, Title, Paragraph, Link } = Typography;

const App: React.FC = () => {
  return (
    <>
      <ConfigProvider theme={THEME}>
        <div>
          <Header style={CSSBasicPageConfig}>
            <Title level={1}>CHI 2025 Papers Explorer</Title>
          </Header>
          <Content>
            <Dashboard />
          </Content>
          <Footer style={CSSPageConfig}>
            <Paragraph type="secondary">© Ruishi (Ray) Zou 2025</Paragraph>
            <Paragraph type="secondary">
              This project is a research prototype licensed under{" "}
              <Link
                href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                target="_blank"
              >
                CC BY-NA-SA 4.0
              </Link>{" "}
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
