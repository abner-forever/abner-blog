---
name: "FsLightbox"
description: "Add FsLightbox-powered media viewing interactions."
source_url: "https://app.grapesjs.com/docs-sdk/plugins/components/fslightbox"
metadata:
  tags: grapesjs, studio-sdk, plugins, components, fslightbox
---


# FsLightbox

|               |              |
| ------------- | ------------ |
| Project types | `web`        |
| Plan          | Startup plan |

Image viewer plugin based on [FsLightbox](https://fslightbox.com).

Install the Studio SDK plugins package:

```sh
npm i @grapesjs/studio-sdk-plugins

```

Import and use the plugin in your project:

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { fsLightboxComponent } from "@grapesjs/studio-sdk-plugins";
// ...
<StudioEditor
  options={{
      // ...
      plugins: [
        fsLightboxComponent?.init({
          block: false // Skip default block
        }),
        // Add custom blocks for the lightbox
        editor => {
          editor.Blocks.add('lightbox-image', {
            label: 'Image',
            category: 'Lightbox examples',
            media: '<svg viewBox="0 0 24 24"><path d="M5,14L8.5,9.5L11,12.5L14.5,8L19,14M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2Z" /></svg>',
            content: {
              type: 'fslightbox',
              attributes: { href: 'https://placehold.co/300/777/white.png?text=Image+LB+(Open)' },
              components: `<h2>Image</h2><img src="https://placehold.co/300/777/white.png?text=Image+LB">`
            }
          });
          editor.Blocks.add('lightbox-video', {
            label: 'Video',
            category: 'Lightbox examples',
            media: '<svg viewBox="0 0 24 24"><path d="M18,14L14,10.8V14H6V6H14V9.2L18,6M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4C22,2.89 21.1,2 20,2Z" /></svg>',
            content: {
              type: 'fslightbox',
              'source-type': 'video',
              attributes: { href: 'https://videos.pexels.com/video-files/15462514/15462514-uhd_2560_1440_30fps.mp4' },
              components: `<h2>Video</h2><img src="https://images.pexels.com/videos/15462514/pexels-photo-15462514.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=300">`
            }
          });
          editor.Blocks.add('lightbox-el', {
            label: 'Element',
            category: 'Lightbox examples',
            media: '<svg viewBox="0 0 24 24"><path d="M20,2H4A2,2 0 0,0 2,4V22L6,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M8,14H6V12H8V14M8,11H6V9H8V11M8,8H6V6H8V8M15,14H10V12H15V14M18,11H10V9H18V11M18,8H10V6H18V8Z" /></svg>',
            content: () => { // Generate block with dynamic IDs
              const randomId = Math.random().toString(36).substring(9);
              const id = `el-id-${randomId}`;
              return [
                {
                  type: 'fslightbox',
                  'source-type': 'el',
                  attributes: { href: `#${id}`, 'data-fslightbox': 'custom-elements' },
                  components: `<h2>Custom element #${randomId}</h2>`
                },
                `<div style="display: none">
                  <div id="${id}" class="custom-element">Custom content #${randomId}</div>
                </div>`
              ];
            }
          });
        }
      ],
      project: {
        default: {
          pages: [
            {
              name: 'Home',
              component: `
                <h1>Single images</h1>
                <a data-fslightbox="image1" href="https://placehold.co/1500/777/white.png?text=Image+1+(Open)">
                  <img src="https://placehold.co/200/777/white.png?text=Image+1">
                </a>
                <a data-fslightbox="image2" href="https://placehold.co/500/777/white.png?text=Image+2+(Open)">
                  <img src="https://placehold.co/200/777/white.png?text=Image+2">
                </a>
                <a data-fslightbox="image3" href="https://placehold.co/500/777/white.png?text=Image+3+(Open)">
                  <img src="https://placehold.co/200/777/white.png?text=Image+3">
                </a>
                <a data-fslightbox="image4" href="https://place-hold.it/500">
                  <img src="https://place-hold.it/200">
                </a>

                <h1>Grouped images</h1>
                <a data-fslightbox="image-group-1" href="https://placehold.co/500/777/white.png?text=Image+1+(Open)">
                  <img src="https://placehold.co/200/777/white.png?text=Image+1">
                </a>
                <a data-fslightbox="image-group-1" href="https://placehold.co/500/777/white.png?text=Image+2+(Open)">
                  <img src="https://placehold.co/200/777/white.png?text=Image+2">
                </a>
                <a data-fslightbox="image-group-1" href="https://placehold.co/500/777/white.png?text=Image+3+(Open)">
                  <img src="https://placehold.co/200/777/white.png?text=Image+3">
                </a>

                <h1>Videos</h1>
                <a data-fslightbox="videos" data-gjs-source-type="video" href="https://www.youtube.com/watch?v=kJyRVdnRwZA">
                  <h2>YouTube video</h2>
                  <img src="https://i.ytimg.com/vi/kJyRVdnRwZA/maxresdefault.jpg" style="height: 300px">
                </a>
                <a data-fslightbox="videos" data-gjs-source-type="video" href="https://videos.pexels.com/video-files/15462514/15462514-uhd_2560_1440_30fps.mp4">
                  <h2>HTML video</h2>
                  <img src="https://images.pexels.com/videos/15462514/pexels-photo-15462514.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=300">
                </a>

                <h1>Custom types</h1>
                <a data-fslightbox="custom-types" href="#vimeo-video">Vimeo Video (iframe)</a>
                <a data-fslightbox="custom-types" href="#google-maps">Google Maps</a>
                <a data-fslightbox="custom-types" href="#custom-element">Custom element</a>
                <div style="display: none">
                    INTENTIONALLY HIDDEN CONTAINER
                    <iframe id="vimeo-video" data-gjs-type="default" src="https://player.vimeo.com/video/22439234" width="1200" height="600" frameBorder="0" allow="autoplay; fullscreen" allowFullScreen></iframe>
                    <iframe id="google-maps" data-gjs-type="default" src="https://maps.google.com/maps?&amp;z=1&amp;t=q&amp;output=embed" frameborder="0" width="1200" height="600"></iframe>
                    <div id="custom-element">
                      <div class="custom-element">Custom content</div>
                    </div>
                </div>

                <style>
                  body {
                    font-family: system-ui;
                    text-align: center;
                  }
                  .custom-element {
                    background: #8b5cf6;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    width: 500px;
                    height: 300px;
                    border-radius: 10px;
                    font-size: 2rem;
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

| Property        | Type           | Description                                                                                                                                                                                |
| --------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| licenseKey      | string | The license key for the plugin. This is optional, only required if the plugin is used outside of Studio SDK.**Example**```js
"your-license-key"

```                                          |
| block           |                | Block options for the component. See https\://grapesjs.com/docs/api/block.html#properties for more information.**Example**```js
{
  "category": "Extra",
  "label": "My label"
}

```            |
| toolbarIconOpen | string | SVG toolbar button icon for opening the lightbox. You can pass an empty string to avoid adding the toolbar button.**Example**```js
"<svg viewBox=\"0 0 24 24\"><path d=\"M12 9a3 3 0..."

``` |
| defaultSrc      | string<!-- --> | Default source for the lightbox component.**Example**```js
"https://placehold.co/300/777/white.png?text=Image"

```                                                                           |
| cdnScript       | string | CDN script to load dynamically in case the library is not available.**Example**```js
"https://cdn.jsdelivr.net/npm/fslightbox@3.4.2/index.js"

```                                            |
