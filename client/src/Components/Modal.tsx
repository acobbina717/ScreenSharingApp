import {
  useState,
  useEffect,
  useCallback,
  MouseEvent,
  useRef,
  UIEvent,
} from "react";
import { io } from "socket.io-client";
const socket = io("http://localhost:4000");

type Props = {
  url: string;
};

const Modal = ({ url }: Props) => {
  const ref = useRef(null);
  const [image, setImage] = useState("");
  const [cursor, setCursor] = useState("");
  const [fullHeight, setFullHeight] = useState("");

  useEffect(() => {
    socket.emit("browse", {
      url,
    });

    //👇🏻 Listens to the cursor event
    socket.on("cursor", (cur) => {
      setCursor(cur);
    });

    /*
        👇🏻 Listens for the images and full height 
             from the PuppeteerMassScreenshots.
           The image is also converted to a readable file.
           */
    socket.on("image", ({ img, fullHeight }) => {
      setImage("data:image/jpeg;base64," + img);
      setFullHeight(fullHeight);
    });
  }, [url]);

  const mouseMove = useCallback((event: MouseEvent<Element>) => {
    const position = event.currentTarget.getBoundingClientRect();
    console.log(position);
    const widthChange = 1255 / position.width;
    const heightChange = 800 / position.height;

    socket.emit("mouseMove", {
      x: widthChange * (event.pageX - position.left),
      y:
        heightChange *
        (event.pageY - position.top - document.documentElement.scrollTop),
    });
  }, []);

  const mouseClick = useCallback((event: MouseEvent) => {
    const position = event.currentTarget.getBoundingClientRect();
    const widthChange = 1255 / position.width;
    const heightChange = 800 / position.height;
    socket.emit("mouseClick", {
      x: widthChange * (event.pageX - position.left),
      y:
        heightChange *
        (event.pageY - position.top - document.documentElement.scrollTop),
    });
  }, []);

  const mouseScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const position = event.currentTarget.scrollTop;
    socket.emit("scroll", {
      position,
    });
  }, []);

  return (
    <div className="popup" onScroll={mouseScroll}>
      <div
        ref={ref}
        className="popup-ref"
        style={{ cursor, height: fullHeight }} //👈🏼 cursor is added
      >
        {image && (
          <img
            src={image}
            onMouseMove={mouseMove}
            onClick={mouseClick}
            alt=""
          />
        )}
      </div>
    </div>
  );
};

export default Modal;
