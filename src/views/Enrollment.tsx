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
  const [error, setError] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [modelsLoaded, setModelsLoaded] = React.useState<boolean>(false);
  const [isPhotoTaken, setIsPhotoTaken] = useState<boolean>(false);
  const [image, setImage] = useState<string>("");
  const [postError, setPostError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    phoneNumber: "",
  });

  const videoHeight = 1200;
  const videoWidth = 600;
  let photoTaken = false;
  let stream: MediaStream | null = null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  useEffect(() => {
    loadModels();
  }, [modelsLoaded]);

  useEffect(() => {
    console.log(isPhotoTaken);
  }, [isPhotoTaken]);
  const loadModels = async () => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]).then(() => {
      setModelsLoaded(true);
      // handleVideoOnPlay();
    });
  };

  const getVideo = async () => {
    setError(false);
    try {
      const userStream = await window.navigator.mediaDevices.getUserMedia({
        video: { width: 600, height: 1200 },
      });
      stream = userStream;
      let video = videoRef.current;
      if (video) {
        video.srcObject = userStream;
        video.play();
        setHasVideo(true);
        setError(false);
      }
    } catch (err: any) {
      console.log(err.message);
      setError(true);
      setErrorMsg(
        err.message === "Requested device not found"
          ? "No camera found"
          : err.message
      );
    }
  };

  const handleVideoOnPlay = () => {
    photoTaken = false;
    // setIsPhotoTaken(false);
    setInterval(async () => {
      if (canvasRef && canvasRef.current) {
        canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(
          videoRef.current!!
        );
        const displaySize = {
          width: videoWidth,
          height: videoHeight,
        };

        faceapi.matchDimensions(canvasRef.current, displaySize);

        const detections = await faceapi
          .detectAllFaces(
            videoRef.current!!,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );
        // console.log(resizedDetections.length);

        if (resizedDetections.length > 0 && !isPhotoTaken && !hasPhoto) {
          // Check if any face has width >= 500 and height >= 900 pixels
          const largeFaces = resizedDetections.filter(
            (detection: any) =>
              detection.detection.box.width >= 300 &&
              detection.detection.box.height >= 500
          );

          if (largeFaces.length > 0) {
            // If at least one face meets the criteria, call takePhoto function
            setError(false);
            takePhoto();
            photoTaken = true;
            // setIsPhotoTaken(true);
          } else {
            setError(true);
            setErrorMsg("Move Closer");
          }
        }

        canvasRef &&
          canvasRef.current &&
          canvasRef.current
            .getContext("2d")
            .clearRect(0, 0, videoWidth, videoHeight);
        canvasRef &&
          canvasRef.current &&
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        // canvasRef &&
        //   canvasRef.current &&
        //   faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        // canvasRef &&
        //   canvasRef.current &&
        //   faceapi.draw.drawFaceExpressions(
        //     canvasRef.current,
        //     resizedDetections
        //   );
      }
    }, 1000);
  };

  const takePhoto = () => {
    setSuccessMsg("");
    console.log("taking photo");
    const width = 600;
    const height = width / (6 / 12);

    let video = videoRef.current;
    let photo = photoRef.current;

    if (photo && video) {
      photo.width = width;
      photo.height = height;

      let ctx = photo.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        setHasPhoto(true);

        // Get the data URL of the photo and set it in state

        const dataURL = photo.toDataURL("image/png");
        setImage(dataURL);

        setIsPhotoTaken(true);
        console.log("take", isPhotoTaken);
      }
    }
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

  const getUserInfo = async (data: Blob) => {
    setPostError(""); // Clear error text
    setLoading(true); // Show loading spinner

    // Create form data
    const formData = new FormData();
    formData.append("file", data);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/upload`,
        {
          method: "POST",
          //   headers: {
          //     Authorization: `Bearer ${accessToken}`,
          //   },
          body: formData,
        }
      );
      const data = await response.json();

      if (data.success === true) {
        // Handle success (e.g., go to Add Profile page)
        // setImageUrl(data.url);
        // setFetchedUser(data.user_info);
        // setCurrentUserModal(UserModals.UserDetails);

        setLoading(false);
        console.log(data);
      } else {
        // Handle error response from server
        const errorData = await response.json();
        setPostError(errorData.message || "Failed to upload image.");
        setLoading(false);
      }
    } catch (error) {
      // Handle network or unexpected errors
      console.log(error);
      setPostError("An error occurred while uploading. Please try again.");
      setLoading(false);
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  const sendImage = async () => {
    setPostError("");
    setErrorMsg("");
    let photo = photoRef.current;
    let ctx = photo?.getContext("2d");

    if (photo && ctx) {
      // let data = photo.toDataURL("image/png");
      photo.toBlob((blob) => {
        if (blob) {
          // Send the Blob to the server
          getUserInfo(blob);
          console.log(blob);
        } else {
          console.error("Failed to convert canvas to Blob.");
        }
      }, "image/png");
      // closePhoto();
      // getUserInfo(data);
      // console.log(data);
      // setFormActive(true);
    }
  };

  useEffect(() => {
    if (modelsLoaded) {
      getVideo();
    }

    return () => {
      // Cleanup: stop the video stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setHasVideo(false); // Reset state
    };
  }, [videoRef, modelsLoaded]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (hasVideo) {
      const handleVideoOnPlay = () => {
        photoTaken = false;
        // setIsPhotoTaken(false);
        intervalId = setInterval(async () => {
          if (canvasRef && canvasRef.current) {
            canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(
              videoRef.current!!
            );
            const displaySize = {
              width: videoWidth,
              height: videoHeight,
            };

            faceapi.matchDimensions(canvasRef.current, displaySize);

            const detections = await faceapi
              .detectAllFaces(
                videoRef.current!!,
                new faceapi.TinyFaceDetectorOptions()
              )
              .withFaceLandmarks()
              .withFaceExpressions();

            const resizedDetections = faceapi.resizeResults(
              detections,
              displaySize
            );
            // console.log(resizedDetections.length);

            if (resizedDetections.length > 0 && !isPhotoTaken && !hasPhoto) {
              // Check if any face has width >= 500 and height >= 900 pixels
              const largeFaces = resizedDetections.filter(
                (detection: any) =>
                  detection.detection.box.width >= 300 &&
                  detection.detection.box.height >= 500
              );

              if (largeFaces.length > 0) {
                // If at least one face meets the criteria, call takePhoto function
                setError(false);
                takePhoto();
                photoTaken = true;
                // setIsPhotoTaken(true);
              } else if (largeFaces.length > 0 && isPhotoTaken) {
                setError(true);
                setErrorMsg("Photo Already Taken");
              } else {
                setError(true);
                setErrorMsg("Move Closer");
              }
            }

            canvasRef &&
              canvasRef.current &&
              canvasRef.current
                .getContext("2d")
                .clearRect(0, 0, videoWidth, videoHeight);
            canvasRef &&
              canvasRef.current &&
              faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
            // canvasRef &&
            //   canvasRef.current &&
            //   faceapi.draw.drawFaceLandmarks(
            //     canvasRef.current,
            //     resizedDetections
            //   );
            // canvasRef &&
            //   canvasRef.current &&
            //   faceapi.draw.drawFaceExpressions(
            //     canvasRef.current,
            //     resizedDetections
            //   );
          }
        }, 1000);
      };

      handleVideoOnPlay();

      return () => {
        clearInterval(intervalId); // Clean up the interval when component unmounts
      };
    }
  }, [isPhotoTaken, hasPhoto, hasVideo, error, errorMsg, videoRef, canvasRef]);

  const sendData = async () => {
    setSuccessMsg("");
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.age ||
      !formData.gender
    ) {
      setErrorText("Please fill out all fields.");
      return;
    }

    if (formData.phoneNumber.length < 11) {
      setErrorText("Please enter a valid number");
      return;
    }

    if (!image) {
      setErrorText("Please capture an image.");
      return;
    }

    setPostError("");
    setLoading(true);

    // console.log(image);

    const payload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      age: formData.age,
      gender: formData.gender,
      image: image,
      phone_number: formData.phoneNumber,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/create_user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log(result);
      if (result) {
        console.log("Data sent successfully:", result);
        setLoading(false);
        setSuccessMsg(result.message);

        setFormData({
          firstName: "",
          lastName: "",
          age: "",
          gender: "",
          phoneNumber: "",
        });
        closePhoto();
        setImage("");
        setHasPhoto(false);
      }
    } catch (error) {
      console.error("Error:", error);
      setPostError("An error occurred while sending data.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col gap-4 p-4 items-center justify-center">
      <div className="flex flex-col gap-4 px-4">
        <p className="text-sm text-black text-center font-semibold">
          Please, center your head in the camera.
        </p>
        {successMsg !== "" && (
          <p className="text-sm text-center font-semibold text-green-600">
            {successMsg}
          </p>
        )}
        {error && (
          <p className="text-sm text-center text-red-600">{errorMsg}</p>
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
        {postError !== "" && (
          <p className="text-sm text-red-600 px-4 text-center">{postError}</p>
        )}

        {hasPhoto && (
          <div className="px-3 hidden  items-center gap-3 rounded-full bg-gray-400 py-1 w-[60%] justify-center mx-auto mb-4">
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
              onClick={sendImage}
              bgColor="white"
              textColor="black"
              borderColor="white"
            />

            <div className="border-transparent bg-transparent hidden" />
            <div className="border-white bg-white text-black hidden" />
          </div>
        )}
        {hasPhoto && (
          <div className="mt-4">
            <h2 className="text-black text-lg font-semibold mb-2">
              Enter Your Details
            </h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                className="p-2 rounded-lg bg-transparent border border-gray-500 text-black placeholder-gray-400 outline-none filter-none"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                className="p-2 rounded-lg bg-transparent border border-gray-500 text-black placeholder-gray-400 outline-none filter-none"
              />
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                maxLength={11}
                onChange={handleInputChange}
                className="p-2 rounded-lg bg-transparent border border-gray-500 text-black placeholder-gray-400 outline-none filter-none"
              />
              <input
                type="number"
                name="age"
                placeholder="Age"
                value={formData.age}
                onChange={handleInputChange}
                className="p-2 rounded-lg bg-transparent border border-gray-500 text-black placeholder-gray-400 outline-none filter-none"
              />
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={`p-2 rounded-lg bg-transparent border border-gray-500 ${
                  formData.gender === "" ? "text-gray-500" : "text-black"
                }  outline-none filter-none`}
              >
                <option value="" className="text-gray-400">
                  Select Gender
                </option>
                <option value="male" className="text-black">
                  Male
                </option>
                <option value="female" className="text-black">
                  Female
                </option>
              </select>
            </div>
            {errorText !== "" && (
              <p className="text-sm text-red-600 px-4 text-center mt-4">
                {errorText}
              </p>
            )}
            <div className="mt-4 w-full">
              <ActionButton2
                text="Enroll User"
                onClick={sendData}
                bgColor="gray-500"
                textColor="white "
                borderColor="gray-500"
              />
            </div>

            <div className="hidden bg-gray-500 border-gray-500" />
          </div>
        )}
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
