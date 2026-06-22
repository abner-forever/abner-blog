---
name: "Swiper"
description: "Add Swiper-based carousel/slider components with configurable behavior."
source_url: "https://app.grapesjs.com/docs-sdk/plugins/components/swiper"
metadata:
  tags: grapesjs, studio-sdk, plugins, components, swiper
---


# Swiper

|               |              |
| ------------- | ------------ |
| Project types | `web`        |
| Plan          | Startup plan |

Slider component plugin based on [Swiper](https://swiperjs.com).

Install the Studio SDK plugins package:

```sh
npm i @grapesjs/studio-sdk-plugins

```

Import and use the plugin in your project:

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { swiperComponent } from '@grapesjs/studio-sdk-plugins';
// ...
<StudioEditor
  options={{
      // ...
      plugins: [
        swiperComponent?.init({
          block: false // Skip default block
        }),
        // Add custom blocks for the swiper
        editor => {
          editor.Blocks.add('swiper', {
            label: 'Swiper Slider',
            category: 'Swiper example',
            media: '<svg viewBox="0 0 24 24"><path d="M22 7.6c0-1-.5-1.6-1.3-1.6H3.4C2.5 6 2 6.7 2 7.6v9.8c0 1 .5 1.6 1.3 1.6h17.4c.8 0 1.3-.6 1.3-1.6V7.6zM21 18H3V7h18v11z" fill-rule="nonzero"/><path d="M4 12.5L6 14v-3zM20 12.5L18 14v-3z"/></svg>',
            content: `<div class="swiper" style="height: 200px">
              <div class="swiper-wrapper">
                <div class="swiper-slide"><div>Slide 1</div></div>
                <div class="swiper-slide"><div>Slide 2</div></div>
                <div class="swiper-slide"><div>Slide 3</div></div>
              </div>
              <div class="swiper-button-next"></div>
              <div class="swiper-button-prev"></div>
            </div>`
          });
        }
      ],
      project: {
        default: {
          pages: [
            {
              name: 'Home',
              component: `
                <h1>Default</h1>
                <div class="swiper" style="height: 200px">
                  <div class="swiper-wrapper">
                    <div class="swiper-slide">Slide 1</div>
                    <div class="swiper-slide">Slide 2</div>
                    <div class="swiper-slide">Slide 3</div>
                  </div>
                </div>

                <h1>Navigation</h1>
                <div class="swiper" style="height: 200px">
                  <div class="swiper-wrapper">
                    <div class="swiper-slide">Slide 1</div>
                    <div class="swiper-slide">Slide 2</div>
                    <div class="swiper-slide">Slide 3</div>
                  </div>
                  <div class="swiper-button-next"></div>
                  <div class="swiper-button-prev"></div>
                </div>

                <h1>Pagination</h1>
                <div class="swiper" style="height: 200px">
                  <div class="swiper-wrapper">
                    <div class="swiper-slide">Slide 1</div>
                    <div class="swiper-slide">Slide 2</div>
                    <div class="swiper-slide">Slide 3</div>
                  </div>
                  <div class="swiper-pagination"></div>
                </div>

                <h1>Scrollbar</h1>
                <div class="swiper" style="height: 200px">
                  <div class="swiper-wrapper">
                    <div class="swiper-slide">Slide 1</div>
                    <div class="swiper-slide">Slide 2</div>
                    <div class="swiper-slide">Slide 3</div>
                  </div>
                  <div class="swiper-scrollbar"></div>
                </div>

                <h1>Vertical</h1>
                <div class="swiper" style="height: 200px" data-gjs-vertical="true">
                  <div class="swiper-wrapper">
                    <div class="swiper-slide">Slide 1</div>
                    <div class="swiper-slide">Slide 2</div>
                    <div class="swiper-slide">Slide 3</div>
                  </div>
                  <div class="swiper-pagination"></div>
                </div>

                <h1>Autoplay</h1>
                <div class="swiper" style="height: 200px" data-gjs-autoplay="true">
                  <div class="swiper-wrapper">
                    <div class="swiper-slide">Slide 1</div>
                    <div class="swiper-slide">Slide 2</div>
                    <div class="swiper-slide">Slide 3</div>
                  </div>
                  <div class="swiper-pagination"></div>
                </div>

                <h1>Space between</h1>
                <div class="swiper" style="height: 200px" data-gjs-space-between="100">
                  <div class="swiper-wrapper">
                    <div class="swiper-slide swiper-slide-bg">Slide 1</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 2</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 3</div>
                  </div>
                  <div class="swiper-pagination"></div>
                </div>

                <h1>Slides per view</h1>
                <div class="swiper" style="height: 200px" data-gjs-space-between="30" data-gjs-slides-per-view="2">
                  <div class="swiper-wrapper">
                    <div class="swiper-slide swiper-slide-bg">Slide 1</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 2</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 3</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 4</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 5</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 6</div>
                  </div>
                  <div class="swiper-pagination"></div>
                </div>

                <h1>Slides per group</h1>
                <div class="swiper" style="height: 200px" data-gjs-space-between="30" data-gjs-slides-per-view="2" data-gjs-slides-per-group="2">
                  <div class="swiper-wrapper">
                    <div class="swiper-slide swiper-slide-bg">Slide 1</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 2</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 3</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 4</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 5</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 6</div>
                  </div>
                  <div class="swiper-pagination"></div>
                </div>

                <h1>Freemode</h1>
                <div class="swiper" style="height: 200px" data-gjs-space-between="30" data-gjs-slides-per-view="3" data-gjs-free-mode="true">
                  <div class="swiper-wrapper">
                    <div class="swiper-slide swiper-slide-bg">Slide 1</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 2</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 3</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 4</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 5</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 6</div>
                  </div>
                </div>

                <h1>Smooth Autoplay</h1>
                <div class="swiper" style="height: 200px"
                  data-gjs-loop="true"
                  data-gjs-speed="5000"
                  data-gjs-slides-per-view="3.5"
                  data-gjs-space-between="50"
                  data-gjs-autoplay="true"
                  data-gjs-autoplay-delay="0"
                  data-gjs-autoplay-disable-on-interaction="false"
                  data-gjs-allow-touch-move="false"
                >
                  <div class="swiper-wrapper" style="transition-timing-function: linear">
                    <div class="swiper-slide swiper-slide-bg">Slide 1</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 2</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 3</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 4</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 5</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 6</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 7</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 8</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 9</div>
                  </div>
                </div>

                <h1>Parallax</h1>
                <div class="swiper" style="height: 300px; text-align: left; padding: 50px;" data-gjs-parallax="true" data-gjs-speed="1000">
                  <div class="parallax-bg" style="background-image: url(https://placehold.co/800x400/eee/777.png?text=Image+Parallax)" data-swiper-parallax="-20%"></div>
                  <div class="swiper-wrapper">
                    <div class="swiper-slide">
                      <h1 data-swiper-parallax="-300">Slide 1</h1>
                      <h2 data-swiper-parallax="-200">Subtitle</h2>
                      <div data-swiper-parallax="-100">Some text content</div>
                    </div>
                    <div class="swiper-slide">
                      <h1 data-swiper-parallax="-300">Slide 2</h1>
                      <h2 data-swiper-parallax="-200">Subtitle</h2>
                      <div data-swiper-parallax="-100">Some text content</div>
                    </div>
                    <div class="swiper-slide">
                      <h1 data-swiper-parallax="-300">Slide 3</h1>
                      <h2 data-swiper-parallax="-200">Subtitle</h2>
                      <div data-swiper-parallax="-100">Some text content</div>
                    </div>
                  </div>
                  <div class="swiper-button-next"></div>
                  <div class="swiper-button-prev"></div>
                </div>

                <h1>Autoheight</h1>
                <div class="swiper" data-gjs-space-between="30" data-gjs-auto-height="true">
                  <div class="swiper-wrapper">
                    <div class="swiper-slide swiper-slide-bg" style="height: 200px">Slide 1</div>
                    <div class="swiper-slide swiper-slide-bg" style="height: 300px">Slide 2</div>
                    <div class="swiper-slide swiper-slide-bg" style="height: 400px">Slide 3</div>
                  </div>
                  <div class="swiper-button-next"></div>
                  <div class="swiper-button-prev"></div>
                </div>

                <h1>Effect Fade</h1>
                <div class="swiper" style="height: 400px" data-gjs-effect="fade">
                  <div class="swiper-wrapper">
                    <div class="swiper-slide">
                      <img class="slide-img" src="https://placehold.co/800x400/777/white.png?text=Image+1" />
                    </div>
                    <div class="swiper-slide">
                      <img class="slide-img" src="https://placehold.co/800x400/777/white.png?text=Image+2" />
                    </div>
                    <div class="swiper-slide">
                      <img class="slide-img" src="https://placehold.co/800x400/777/white.png?text=Image+3" />
                    </div>
                  </div>
                  <div class="swiper-button-next"></div>
                  <div class="swiper-button-prev"></div>
                  <div class="swiper-pagination"></div>
                </div>

                <h1>Effect Cube</h1>
                <div class="swiper" style="height: 400px; width: 400px; margin: 50px auto;" data-gjs-effect="cube">
                  <div class="swiper-wrapper">
                    <div class="swiper-slide">
                      <img src="https://placehold.co/400x400/777/white.png?text=Image+1" />
                    </div>
                    <div class="swiper-slide">
                      <img src="https://placehold.co/400x400/777/white.png?text=Image+2" />
                    </div>
                    <div class="swiper-slide">
                      <img src="https://placehold.co/400x400/777/white.png?text=Image+3" />
                    </div>
                  </div>
                  <div class="swiper-button-next"></div>
                  <div class="swiper-button-prev"></div>
                  <div class="swiper-pagination"></div>
                </div>

                <h1>Effect Coverflow</h1>
                <div
                  class="swiper swiper-coverflow" style="height: 400px"
                  data-gjs-effect="coverflow"
                  data-gjs-slides-per-view="auto"
                  data-gjs-centered-slides="true"
                >
                  <div class="swiper-wrapper">
                    <div class="swiper-slide">
                      <img class="slide-img" src="https://placehold.co/400x400/777/white.png?text=Image+1" />
                    </div>
                    <div class="swiper-slide">
                      <img class="slide-img" src="https://placehold.co/400x400/777/white.png?text=Image+2" />
                    </div>
                    <div class="swiper-slide">
                      <img class="slide-img" src="https://placehold.co/400x400/777/white.png?text=Image+3" />
                    </div>
                  </div>
                  <div class="swiper-pagination"></div>
                </div>

                <h1>Effect Flip</h1>
                <div class="swiper swiper-flip" style="height: 300px; width: 300px; padding: 50px; margin: 25px auto;" data-gjs-effect="flip">
                  <div class="swiper-wrapper">
                    <div class="swiper-slide">
                      <img class="slide-img" src="https://placehold.co/400x400/777/white.png?text=Image+1" />
                    </div>
                    <div class="swiper-slide">
                      <img class="slide-img" src="https://placehold.co/400x400/777/white.png?text=Image+2" />
                    </div>
                    <div class="swiper-slide">
                      <img class="slide-img" src="https://placehold.co/400x400/777/white.png?text=Image+3" />
                    </div>
                  </div>
                  <div class="swiper-button-next"></div>
                  <div class="swiper-button-prev"></div>
                  <div class="swiper-pagination"></div>
                </div>

                <h1>Effect Cards</h1>
                <div class="swiper" style="height: 300px; width: 300px; margin: 0 auto;" data-gjs-effect="cards">
                  <div class="swiper-wrapper">
                    <div class="swiper-slide">
                      <img class="slide-img" src="https://placehold.co/400x400/777/white.png?text=Image+1" />
                    </div>
                    <div class="swiper-slide">
                      <img class="slide-img" src="https://placehold.co/400x400/777/white.png?text=Image+2" />
                    </div>
                    <div class="swiper-slide">
                      <img class="slide-img" src="https://placehold.co/400x400/777/white.png?text=Image+3" />
                    </div>
                  </div>
                </div>

                <h1>Responsive</h1>
                <div class="swiper" style="height: 200px; padding: 50px"
                  data-gjs-space-between="10"
                  data-gjs-slides-per-view="1"
                  data-gjs-mobile="true"
                  data-gjs-mobile-slides-per-view="2"
                  data-gjs-mobile-space-between="20"
                  data-gjs-tablet="true"
                  data-gjs-tablet-slides-per-view="3"
                  data-gjs-tablet-space-between="30"
                >
                  <div class="swiper-wrapper">
                    <div class="swiper-slide swiper-slide-bg">Slide 1</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 2</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 3</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 4</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 5</div>
                    <div class="swiper-slide swiper-slide-bg">Slide 6</div>
                  </div>
                  <div class="swiper-button-next"></div>
                  <div class="swiper-button-prev"></div>
                  <div class="swiper-pagination"></div>
                </div>

                <style>
                  body {
                    font-family: system-ui;
                    text-align: center;
                  }
                  .columns {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                  }
                  .slide-img {
                    width: 100%;
                    object-fit: cover;
                    height: 100%;
                  }
                  .parallax-bg {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 130%;
                    height: 100%;
                    background-size: cover;
                    background-position: center;
                  }
                  .swiper-slide-bg {
                    background: #f1f1f1
                  }
                  .swiper-coverflow .swiper-slide,
                  .swiper-flip .swiper-slide {
                    width: 50%;
                  }
                  .swiper {
                    border: 2px solid #333;
                    margin: 50px;
                  }
                  .swiper:after {
                    content: "Swiper Example";
                    position: absolute;
                    top: 0;
                    background-color: #333;
                    color: white;
                    left: 0;
                    font-size: 0.5rem;
                    padding: 3px;
                  }
                </style>
                `
            },
          ]
        }
      }

  }}
/>

```

### Plugin options

| Property   | Type                                              | Description                                                                                                                                           |
| ---------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| block      | [Block](https://grapesjs.com/docs/api/block.html) | Additional Block properties of the component. Pass `false` to avoid adding the block.**Example**```js
{
  "category": "Extra",
  "label": "My label"
}

``` |
| cdnScript  | string<!-- -->                                    | CDN scripts to load dynamically in case the library is not available.**Default**```js
https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js

```   |
| cdnStyle   | string                                    | CDN styles to load dynamically.**Default**```js
https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css

```                                        |
| licenseKey | string<!-- -->                                    | The license key for the plugin. This is optional, only required if the plugin is used outside of Studio SDK.**Example**```js
"your-license-key"

```     |
