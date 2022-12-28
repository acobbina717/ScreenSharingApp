import { useState, useCallback, FormEvent, ChangeEvent, useRef } from "react";
import Modal from "./Modal";
import { Input, Loader } from "@mantine/core";
import { IconWorldWww } from "@tabler/icons";

const Home = () => {
  const timeoutRef = useRef<number>(-1);
  const [url, setURL] = useState("");
  const [finalUrl, setFinalURL] = useState("");
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const handleCreateChannel = (e: FormEvent) => {
    e.preventDefault();
    if (url) {
      setFinalURL(url);
      setShow(true);
    }
  };
  console.log("Home", finalUrl);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    window.clearTimeout(timeoutRef.current);

    setURL(e.target.value);
    if (e.target.value.trim().length === 0) {
      setIsLoading(false);
      return;
    } else {
      setIsLoading(true);
      timeoutRef.current = window.setTimeout(() => {
        setIsLoading(false);
        setFinalURL(url);
      }, 1000);
    }
  };

  return (
    <div>
      <div className="home__container">
        <h2>URL</h2>
        <form className="form">
          <label>Provide a URL</label>
          <Input
            type="url"
            name="url"
            id="url"
            required
            autoFocus
            value={url}
            // autoComplete="off"
            onChange={handleChange}
            className="form__input"
            icon={<IconWorldWww width="24" height="24" stroke={"1"} />}
            rightSection={
              isLoading ? <Loader color="indigo" size={"xs"} /> : null
            }
          />
        </form>
        {show && <Modal url={finalUrl} />}
        <button className="createChannelBtn" onClick={handleCreateChannel}>
          BROWSE
        </button>
      </div>
    </div>
  );
};

export default Home;
