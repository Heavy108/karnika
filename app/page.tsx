"use client";
/* eslint-disable no-console */
/* eslint-disable*/
// import { Link } from "@heroui/link";
// import { Snippet } from "@heroui/snippet";
// import { Code } from "@heroui/code";
// import { button as buttonStyles } from "@heroui/theme";

import { Button, ButtonGroup } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { useState } from "react";
import {
  LuCloudUpload,
  LuCheck,
  LuCornerUpLeft,
  LuDownload,
} from "react-icons/lu";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import Image from "next/image";

// import { siteConfig } from "@/config/site";
// import { title, subtitle } from "@/components/primitives";
// import { GithubIcon } from "@/components/icons";

export default function Home() {
  const [filesData, setFilesData] = useState([]);
  const [filesUploaded, setFilesUploaded] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [processingScreen, setProcessingScreen] = useState(false);
  const [defaultName, setDefaultName] = useState(() => {
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, "0");
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const year = currentDate.getFullYear();
    const formattedDate = `${day}_${month}_${year}`;
    return `data_${formattedDate}`;
  });
  const [customName, setCustomName] = useState("");
  const [processingDone, setProcessingDone] = useState(false);
  const [index, setindex] = useState(0);
  const updateFileData = (index: any, newData: any) => {
    setFilesData((prevFiles: any) =>
      prevFiles.map((fileObj: any, idx: any) =>
        idx === index ? { ...fileObj, ...newData } : fileObj,
      ),
    );
  };

  const handleFileChange = (event: any) => {
    const selectedFiles = Array.from(event.target.files).map((f: any) => ({
      file: f,
      preview: URL.createObjectURL(f),
      result: "",
      error: "",
      isLoading: false,
    }));
    //  @ts-ignore
    setFilesData(selectedFiles);
    setFilesUploaded(true);
  };
  //  @ts-ignore
  const handleUpload = async (event: any) => {
    event.preventDefault();
    if (filesData.length === 0) return;

    filesData.forEach(async (fileObj, index) => {
      try {
        updateFileData(index, { isLoading: true, error: "", result: "" });

        const formData = new FormData();
        formData.append("file", fileObj.file);
        formData.append("csvName", defaultName);

        const response = await fetch("/api/document", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("File upload failed. Please try again.");
        }

        const data = await response.json();
        if (data.error) {
          updateFileData(index, { error: data.error, isLoading: false });
        } else {
          setFilesData((prevFiles) =>
            prevFiles.filter((_, idx) => idx !== index),
          );
          setProcessingScreen(false);
          setProcessingDone(true);
        }
      } catch (err: any) {
        updateFileData(index, { error: err.message, isLoading: false });
      }
    });
  };

  const handleDownloadCsv = async () => {
    try {
      const response = await fetch(
        `/api/download-csv?csvName=${encodeURIComponent(defaultName)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to download CSV file");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = defaultName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download CSV error:", error);
      alert("Error downloading CSV file: " + error.message);
    }
  };

  return (
    <>
      <Card className="py-4">
        <CardBody className="overflow-visible py-2 flex flex-col justify-center items-center">
          {processingDone && (
            <>
              <h1>Your file is ready for download</h1>
              <br />
              <p className="px-4 text-sm text-center text-foreground-500">
                The file can be opened with Microsoft Excel, LibreOffice or any
                software that supports the CSV format
              </p>
              <br />
              <Button
                color="primary"
                className="px-8"
                startContent={<LuDownload />}
                onClick={handleDownloadCsv}
              >
                Download
              </Button>
            </>
          )}
          {processingScreen && (
            <>
              <p>
                Preparing{" "}
                <span className="font-bold" style={{ fontFamily: "monospace" }}>
                  {defaultName}.csv
                </span>
              </p>
              <br />
              <Image
                alt="loading"
                src="/tube-spinner.svg"
                width={150}
                height={150}
              />
              <br />
              <p className="text-sm text-foreground-500">
                Please keep this tab open
              </p>
              {/* {setTimeout(() => {
                setProcessingScreen(false);
                setProcessingDone(true);
              }, 5000)} */}
            </>
          )}
          {!filesUploaded && !processingScreen && (
            <>
              <p className="text-center text-sm text-foreground-500">
                Scanned files must be blur-free for accurate results. Multiple
                files upload supported.
              </p>
              <br />
              <input
                id="fileInput"
                type="file"
                style={{ display: "none" }}
                multiple
                onChange={handleFileChange}
              />
              <LuCloudUpload className="text-8xl" color="#535F75" />
              <br />
              <Button
                className="px-10"
                color="primary"
                onPress={() => {
                  document.getElementById("fileInput")?.click();

                  console.log("kucch hua");
                }}
              >
                Upload Files
              </Button>
            </>
          )}
          {filesUploaded && !processingScreen && !processingDone && (
            <>
              <p className="text-foreground-500">You've uploaded</p>
              <br />
              <p className="text-6xl font-bold">{filesData.length}</p>
              <p className="text-foreground-500">files</p>
              <br />
              <div className="flex gap-4">
                <Button
                  onPress={onOpen}
                  startContent={<LuCheck />}
                  color="primary"
                  className="text-foreground-50"
                >
                  Looks Good
                  <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                    <ModalContent>
                      {(onClose) => (
                        <>
                          <ModalHeader className="flex flex-col gap-1">
                            What do you want to call the file?
                          </ModalHeader>
                          <ModalBody>
                            <Input
                              label="File name"
                              value={customName}
                              onValueChange={setCustomName}
                              placeholder={defaultName}
                              size={"lg"}
                              endContent={
                                <div className="pointer-events-none flex items-center">
                                  <span className="text-default-400">.csv</span>
                                </div>
                              }
                            />
                          </ModalBody>
                          <ModalFooter>
                            <Button
                              color="danger"
                              variant="light"
                              onPress={onClose}
                            >
                              Close
                            </Button>
                            <Button
                              color="primary"
                              onPress={() => {
                                onClose();
                                handleUpload(event);
                                setProcessingScreen(true);
                                if (customName.length != 0) {
                                  setDefaultName(customName);
                                }
                              }}
                            >
                              Proceed
                            </Button>
                          </ModalFooter>
                        </>
                      )}
                    </ModalContent>
                  </Modal>
                </Button>
                <Button
                  onPress={() => setFilesUploaded(false)}
                  startContent={<LuCornerUpLeft />}
                >
                  Go Back
                </Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </>
  );
}
