import React from "react";
import { DecoratorNode } from "lexical";

export class ImageNode extends DecoratorNode {
  __src;
  __altText;
  __width;
  __height;

  static getType() {
    return "image";
  }

  static clone(node: { __src: any; __altText: any; __width: any; __height: any; }) {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height
    );
  }

  constructor(src, altText, width, height) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width || "inherit";
    this.__height = height || "inherit";
  }

  createDOM(config) {
    const span = document.createElement("span");
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return (
      <img
        src={this.__src}
        alt={this.__altText}
        width={this.__width}
        height={this.__height}
      />
    );
  }
}

export function $createImageNode(src: string, altText: string, width: number, height: undefined, key: undefined) {
  return new ImageNode(src, altText, width, height);
}
