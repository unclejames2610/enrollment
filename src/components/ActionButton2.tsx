import React, { FC, MouseEventHandler } from "react";

interface ActionButton2Props {
  text: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  borderColor?: string;
  bgColor?: string;
  textColor?: string;
  textSmall?: boolean;
}

const ActionButton2: FC<ActionButton2Props> = ({
  text,
  onClick,
  borderColor,
  bgColor,
  textColor,
  textSmall,
}) => {
  return (
    <button
      className={`flex items-center gap-2 ${
        textColor ? `text-${textColor}` : "text-white"
      } ${textSmall ? "text-xs" : "text-sm"} ${
        bgColor ? `bg-${bgColor}` : "bg-altBlack"
      } border ${
        borderColor ? `border-${borderColor}` : "border-altBlack"
      }  rounded-full py-3 px-5 w-full text-center justify-center`}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default ActionButton2;
