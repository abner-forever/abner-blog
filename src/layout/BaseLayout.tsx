// import React, { useEffect } from "react";
// import { useOutlet, useLocation, useNavigationType } from "react-router-dom";
// import { CSSTransition, TransitionGroup } from "react-transition-group";
// import { newRouters } from "@/routes/routers";




// import "./style.less";


// initSentry();

// const ANIMATION_MAP = {
//   PUSH: "forward",
//   POP: "back",
//   REPLACE: "back",
// };

// let audioPromise = new Promise(() => {});

// // 授权组件
// function BaseLayout() {
//   const location = useLocation();
//   const currentOutlet = useOutlet();
//   const navigateType = useNavigationType();
//   const { nodeRef } =
//     newRouters.find((route) => route.path === location.pathname) ?? {};
//   const fullPath = `${location.pathname}${location.search}`;
//   const ignoreCachePathList = newRouters
//     .filter((route) => route.ignoreCache)
//     .map((route) => route.path);

//   const { BackgroundMusic, EyeProtectionMode } = useAppSelector(
//     (state) => state.settings
//   );

//   useEffect(() => {
//     // 路由变化时，页面滚动到最顶部
//     if (location.pathname) {
//       window.scrollTo({ top: 0 });
//     }
//   }, [location.pathname]);

//   useEffect(() => {
//     initBackgroundMusic();
//   }, [BackgroundMusic]);

//   const initBackgroundMusic = () => {
//     if (BackgroundMusic) {
//       audioPromise = audio.play(bgm, () => {}, true);
//     }
//     audioPromise.then((cleanup) => {
//       if (!BackgroundMusic) {
//         // @ts-ignore
//         cleanup();
//       }
//     });
//   };

//   return (
//     <TransitionGroup
//       childFactory={(child) =>
//         React.cloneElement(child, { classNames: ANIMATION_MAP[navigateType] })
//       }
//     >
//       <CSSTransition
//         key={location.pathname}
//         // @ts-ignore
//         nodeRef={nodeRef}
//         timeout={300}
//         unmountOnExit
//       >
//         {() => (
//           // @ts-ignore
//           <div ref={nodeRef}>
//             <KeepAlive
//               id={fullPath}
//               saveScrollPosition="screen"
//               name={fullPath}
//               when={!ignoreCachePathList.includes(fullPath)}
//             >
//               {currentOutlet}
//             </KeepAlive>
//             {EyeProtectionMode && <div className="eye-protect" />}
//           </div>
//         )}
//       </CSSTransition>
//     </TransitionGroup>
//   );
// }

// export default BaseLayout;
