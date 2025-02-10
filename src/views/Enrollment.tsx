"use client";
import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import Image from "next/image";
import { IoClose } from "react-icons/io5";
import Loader from "@/components/Loader";
import ActionButton2 from "@/components/ActionButton2";

const Enrollment = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = React.useRef<any>();
  const [hasVideo, setHasVideo] = useState<boolean>(false);
  const [hasPhoto, setHasPhoto] = useState<boolean>(false);
  const [errorText, setErrorText] = useState("");
  const [modelsLoaded, setModelsLoaded] = React.useState<boolean>(false);
  const [isPhotoTaken, setIsPhotoTaken] = useState<boolean>(false);
  const [image, setImage] = useState<string>("");
  const [postError, setPostError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
  });

  const videoHeight = 1200;
  const videoWidth = 600;
  let photoTaken = false;
  let stream: MediaStream | null = null;


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

 
  const closePhoto = () => {
    let photo = photoRef.current;
    let ctx = photo?.getContext("2d");

    if (photo && ctx) {
      ctx.clearRect(0, 0, photo.width, photo.height);
      setHasPhoto(false);
      setIsPhotoTaken(false);
      photoTaken = false;
      setImage("");
      console.log("close", isPhotoTaken);
    }
  };

  const sendData = async () => {

    if (!formData.name || !formData.age || !formData.gender) {
      setErrorText("Please fill out all fields.");
      return;
    }

    if (!image) {
      setErrorText("Please capture an image.");
      return;
    }

    setPostError(""); 
    setLoading(true);

    const payload = {
      name: formData.name,
      age: formData.age,
      gender: formData.gender,
      image: image, 
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        console.log("Data sent successfully:", result);
        setLoading(false);


        setFormData({ name: "", age: "", gender: "" });
        setImage("");
        setHasPhoto(false);
      } else {
        setPostError(result.message || "Failed to send data.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      setPostError("An error occurred while sending data.");
      setLoading(false);
    }
  };

  const renderForm = () => (
    <div className="mt-4">
      <h2 className="text-white text-lg font-semibold mb-2">Enter Your Details</h2>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleInputChange}
          className="p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400"
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={formData.age}
          onChange={handleInputChange}
          className="p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400"
        />
        <select
          name="gender"
          value={formData.gender}
          onChange={handleInputChange}
          className="p-2 rounded-lg bg-gray-700 text-white"
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      <button
        onClick={sendData}
        className="mt-4 bg-primary-green text-white px-4 py-2 rounded-lg"
      >
        Submit
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-4 px-4">
        <p className="text-sm text-white text-center font-semibold">
          Please, center your head in the camera.
        </p>
        {errorText !== "" && (
          <p className="text-sm text-red-600 px-4 text-center">{errorText}</p>
        )}
        <div className="flex items-center justify-center gap-4 pb-4">
          <div
            className={`${
              !hasVideo ? "border border-gray-400" : ""
            } rounded-lg h-56 w-48 md:h-72 md:w-64 relative`}
          >
            {modelsLoaded && (
              <video
                crossOrigin="anonymous"
                ref={videoRef}
                className="h-full w-full rounded-lg object-fill"
                autoPlay
              ></video>
            )}

            {modelsLoaded && (
              <canvas
                ref={canvasRef}
                className="absolute h-56 w-48 md:h-72 md:w-64 top-0 rounded-lg"
              ></canvas>
            )}
          </div>

          <div
            className={` ${
              !hasPhoto ? "hidden" : ""
            } h-56 w-48 md:h-72 md:w-64 relative`}
          >
            {hasPhoto && image && (
              <div
                className="p-1.5 bg-gray-100 rounded-full w-fit h-fit absolute top-1 right-1 cursor-pointer z-10"
                onClick={closePhoto}
              >
                <IoClose className="text-lg text-gray-400" />
              </div>
            )}

            {hasPhoto && (
              <Image
                src={image}
                alt="image"
                className="object-fill rounded-lg"
                fill={true}
              />
            )}

            <canvas ref={photoRef} className="w-full h-full hidden"></canvas>
          </div>
        </div>
        {errorText !== "" && (
          <p className="text-sm text-red-600 px-4 text-center">{errorText}</p>
        )}

        {hasPhoto && (
          <div className="px-3 flex items-center gap-3 rounded-full bg-[#2F313399] py-1 w-[60%] justify-center mx-auto mb-4">
            <ActionButton2
              text="Recapture"
              bgColor="transparent"
              borderColor="transparent"
              textSmall
              onClick={closePhoto}
            />

            <ActionButton2
              text="Submit Image"
              textSmall
              onClick={sendData}
              bgColor="[#14151680]"
              borderColor="[#14151680]"
            />
          </div>
        )}
        {hasPhoto && renderForm()}
      </div>

      {/* loader */}
      {loading && <div className="absolute bg-black/40 z-10 w-full h-full" />}

      {loading && (
        <div className="flex items-center flex-col w-full h-full justify-center absolute">
          <Loader />
        </div>
      )}
    </div>
  );
};

export default Enrollment;