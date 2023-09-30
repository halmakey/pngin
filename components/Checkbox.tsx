import { InputHTMLAttributes, ReactNode, useCallback, useState } from "react";

const images = {
  default:
    "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAYAAAAehFoBAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABkSURBVHgB7dexCYBAEETRUQStQXvR2rUXrUEjTQ2X4wbujv/ihf3pSAAAoCBd5Ghcz1cGz7GE/v8N0cN7n5XTtF1K0asyBLsR7EawG8FuBLsR7EawG8FuBLuFN13qBgMAAE37ABXtCF2arUZ9AAAAAElFTkSuQmCC)",
  active:
    "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAYAAAAehFoBAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABkSURBVHgB7dexCYBAEETRUQTtRavTOrQ67UUjTQ2X4wbujv/ihf3pSAAAoCBd5Gic91cGz7WF/v8N0cP7XJXTtBxK0asyBLsR7EawG8FuBLsR7EawG8FuBLuFN13qBgMAAE37AKx7B/LeATnxAAAAAElFTkSuQmCC)",
  checked:
    "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAYAAAAehFoBAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJBSURBVHgB7ZcxSBtRHMa/M00MiIOgU0DRwaWdpBSRLoqzi0GpFMHiXJDWqaMWQTDg5CJSoSouiiAFQdyLs7joIAqiiLiImph8/p+Jmrt7p0m8SxzeDz4uvLzj/e7l3Xv/AAaDwWAwGN4QViGdqt9PEQFws/NDO74M1iyXW8mJJGXdNxWBEvYb3SRIQ0wyIzmXnEr+SiL5fd7hjSBiv+XyXVKTa/on+Sazm0SxBDHDipxolWRbwrwsS0I6lypUEJH6JJcryce85j+SLzKzad09lRFOpYDBQfXpP+xrdAbZZZDxurX8a/jwEGhrA87OnN9MSUZf2hHKO8OLi7JhNetkf4noz6K3Ly88X7qLC3J1lby+fv7tymTIeJyOF0slI/kKv9EKb2yQ/f2yoVaTe3vessfHZEODW1bdB3xGELiEGxvtAx8c6GUXFshQyC3b0kLu7wdyej4Jp9Pk0hLZ1GQf3LLIiQm7qOo7PKxbAmRfH3l5ed8NQfE4w2NjeolwOPvTK3Z3yd7e7IM4+42P254LQfEonEySXV166fp6cnqajMX0svPzNtmgCiq78IN0d7deWolGIu72tTXX8i5VuPh9OBwGVlaAjg73d0ov6ahV5uaAnh74RWkHR20tsL4OtLd797HkGEgkgKEh+EnpJ11dHbC5CXR22tutXE0+MACMjMBvXnc010jpurUlFcCoFIN51WBrKzA7iyDwp5aYnASOjrJLIB6XanYZiEZRMcr1F6kQCi4vox8SMBgMBoPBYHBwBxwVD/+d08+xAAAAAElFTkSuQmCC)",
  disabled:
    "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAYAAAAehFoBAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAB+SURBVHgB7dexCYAwEIXh05UcxAHsHMDSISwdwM4BHMSZFK1SHuEeXOD/mjSB/LwuZgAAIJHOc2letscEjn11vV/qvRencQg9a7mDz+v+H4s65cGRsd8pD2ZhdTALq4NZWB3MwupgFlYHs7A6mIXVwSysDs6ycHOfUAAAkMoLYvJK65Csl4sAAAAASUVORK5CYII=)",
  hover:
    "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAYAAAAehFoBAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABsSURBVHgB7dexDYAgFEVRnMO13Me4jyswjnNgaCx+hQkYo+c0NCS83I6UAIAXmVouLdtR0gD7Oje9f1sdnHMuVa9zVIRrcM+x9Rw+WGGFw2CFFQ6DFVY4DFZY4TBYYYXDYIX/Uvibn1AA4Ckn+3QUVcL/zkgAAAAASUVORK5CYII=)",
};

export function Checkbox({
  children,
  defaultChecked,
  onChange,
}: {
  children?: ReactNode;
  defaultChecked?: boolean;
  onChange?: (value: boolean) => void;
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const [checked, setChecked] = useState(!!defaultChecked);

  const handleClick = useCallback(() => {
    setChecked((c) => {
      const value = !c;
      onChange?.(value);
      return value;
    });
  }, [onChange]);

  const handleMouseEnter = useCallback(() => {
    setHover(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHover(false);
  }, []);

  const handleMouseDown = useCallback(() => {
    setActive(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setActive(false);
  }, []);

  return (
    <button
      role="checkbox"
      aria-checked={checked ? "true" : "false"}
      type="button"
      className="flex min-h-[44px] min-w-[44px] items-center bg-no-repeat pl-[48px]"
      style={{
        backgroundImage: checked
          ? images.checked
          : active
          ? images.active
          : hover
          ? images.hover
          : images.default,
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {children}
    </button>
  );
}
