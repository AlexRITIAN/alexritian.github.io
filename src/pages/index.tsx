import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Translate, {translate} from '@docusaurus/Translate';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <div className="hero">
      <div className={styles.welcome_intro}>
      <h1 className={styles.hero_title}>
      <span style={{ 
            color: 'white', 
            textShadow: '0 0 5px #fff, 0 0 10px #fff' 
          }}><Translate>欢迎来到 ~</Translate></span>
          <span
            style={{ 
              color: 'var(--cyberpunk-primary-color)', 
              textShadow: 'var(--cyberpunk-shadow)' 
            }}
          > Moonlit</span>
        </h1>
        <p 
          className="hero__subtitle" 
          style={{ 
            color: 'var(--cyberpunk-secondary-color)', 
            textShadow: 'var(--cyberpunk-secondary-shadow)' 
          }}
        >
          <Translate>一起探索技术的奇妙世界吧！</Translate>
        </p>
      </div>
      <div className={styles.welcome_svg}>
        <img src={useBaseUrl("/img/moonlit-logo-animated-transparent-corrected.svg")} />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Layout>
      <HomepageHeader />
      <main>
        <br />
        {/* <HomepageFeatures /> */}
      </main>
    </Layout>
  );
}