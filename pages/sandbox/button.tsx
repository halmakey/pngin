import Main from "@/components/Main";
import {
  faSadCry,
  faSadTear,
  faSmile,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Page() {
  return (
    <Main className="items-start gap-4">
      <div className="flex gap-2">
        <button className="btn-fill">FillButton</button>
        <button className="btn-fill" disabled>
          Disabled
        </button>
      </div>
      <div className="flex gap-2">
        <button className="btn-border">BorderButton</button>
        <button className="btn-border" disabled>
          Disabled
        </button>
      </div>
      <div className="flex flex-col gap-4 bg-gray-800 p-4">
        <div className="flex gap-2">
          <button className="btn-fill-invert">FillInvertButton</button>
          <button className="btn-fill-invert" disabled>
            Disabled
          </button>
        </div>
        <div className="flex gap-2">
          <button className="btn-border-invert">FillBorderButton</button>
          <button className="btn-border-invert" disabled>
            Disabled
          </button>
        </div>
        <div className="flex gap-2">
          <button className="btn-opacity fill-white text-white">
            <FontAwesomeIcon icon={faSmile} />
            OpacityButton
          </button>
          <button className="btn-opacity fill-white text-white" disabled>
            <FontAwesomeIcon icon={faSadCry} />
            Disabled
          </button>
        </div>
        <div className="flex gap-2">
          <button className="btn-opacity-dim fill-white text-white">
            <FontAwesomeIcon icon={faSmile} />
            OpacityDimButton
          </button>
          <button className="btn-opacity-dim fill-white text-white" disabled>
            <FontAwesomeIcon icon={faSadTear} />
            Disabled
          </button>
        </div>
      </div>
    </Main>
  );
}
