import React, { useEffect } from "react";
import { Page } from "@/components";
import styles from "./style.module.less";

const Video = () => {
  useEffect(() => {}, []);
  return (
    <Page>
      <iframe
        className={styles.video_iframe}
        src="//player.bilibili.com/player.html?bvid=BV1zK4y1G7U2&cid=339262048&page=1&high_quality=1&danmaku=0"
        allowFullScreen
        scrolling="no"
        frameBorder="0"
        sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
      />
    </Page>
  );
};

export default Video;
