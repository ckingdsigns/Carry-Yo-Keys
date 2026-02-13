import React, { useState, useRef, useEffect } from "react";

export default function App() {
  const [step, setStep] = useState(1);
  const [audioURL, setAudioURL] = useState(null);

  const [singerCount, setSingerCount] = useState(1);
  const [singers, setSingers] = useState([""]);

  const [lyricsText, setLyricsText] = useState("");
  const [assignments, setAssignments] = useState([]);

  const [syncMode, setSyncMode] = useState("line");
  const [syncItems, setSyncItems] = useState([]);
  const [timings, setTimings] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const audioRef = useRef(null);

  /* Update singer inputs dynamically */
  useEffect(() => {
    setSingers((prev) =>
      Array.from({ length: singerCount }, (_, i) => prev[i] || "")
    );
  }, [singerCount]);

  /* Spacebar Sync */
  useEffect(() => {
    const handleKey = (e) => {
      if (step !== 4) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!audioRef.current) return;
        if (currentIndex >= syncItems.length) return;

        const newEntry = {
          time: audioRef.current.currentTime,
          ...syncItems[currentIndex],
        };

        setTimings((prev) => [...prev, newEntry]);
        setCurrentIndex((prev) => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [step, currentIndex, syncItems]);

  /* Build Sync Items When Entering Step 4 */
  useEffect(() => {
    if (step !== 4) return;

    let items = [];

    if (syncMode === "line") {
      items = assignments;
    } else {
      assignments.forEach((line) => {
        line.text.split(" ").forEach((word) => {
          if (word.trim() !== "") {
            items.push({
              text: word,
              singer: line.singer,
            });
          }
        });
      });
    }

    setSyncItems(items);
    setTimings([]);
    setCurrentIndex(0);
  }, [syncMode, step]);

  /* Handle Audio Upload */
  const handleAudioUpload = (file) => {
    if (!file) return;
    setAudioURL(URL.createObjectURL(file));
    setStep(2);
  };

  /* Process Lyrics */
  const processLyrics = () => {
    const splitLines = lyricsText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "");

    setAssignments(
      splitLines.map((line) => ({
        text: line,
        singer: singers[0] || "Singer 1",
      }))
    );

    setStep(3);
  };

  /* Export Timing JSON */
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(timings, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lyrics_timing.json";
    a.click();
  };

  return (
    <div className="min-h-screen bg-blue-950 flex flex-col items-center p-6 text-white">
      <div className="w-full max-w-4xl bg-white text-gray-900 shadow-2xl rounded-xl p-8">

        {/* HEADER */}
        <div className="bg-blue-900 text-yellow-400 p-6 rounded-lg text-center mb-8">
          <h1 className="text-3xl font-bold tracking-wide">
            CKing – Carry Yo Keys
          </h1>
        </div>

        {/* STEP 1 – Upload */}
        {step === 1 && (
          <div className="text-center">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              Upload Instrumental
            </h2>

            <input
              type="file"
              accept="audio/*"
              onChange={(e) => handleAudioUpload(e.target.files[0])}
              className="mb-6"
            />

            <p className="text-gray-500">
              Make sure your file does not include vocals.
            </p>
          </div>
        )}

        {/* STEP 2 – Lyrics & Singers */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              Song Details & Lyrics
            </h2>

            <label className="font-semibold block mb-2">
              Performance Type
            </label>

            <select
              value={singerCount}
              onChange={(e) => setSingerCount(parseInt(e.target.value))}
              className="border p-2 rounded mb-4 w-full"
            >
              <option value={1}>Solo</option>
              <option value={2}>Duet</option>
              <option value={3}>Trio</option>
              <option value={4}>Quartet</option>
              <option value={5}>5 People</option>
            </select>

            {singers.map((name, i) => (
              <input
                key={i}
                value={name}
                onChange={(e) => {
                  const updated = [...singers];
                  updated[i] = e.target.value;
                  setSingers(updated);
                }}
                placeholder={`Singer ${i + 1} Name`}
                className="border p-2 rounded block mb-2 w-full"
              />
            ))}

            <textarea
              value={lyricsText}
              onChange={(e) => setLyricsText(e.target.value)}
              rows="6"
              placeholder="Enter lyrics (one line per line)..."
              className="w-full border rounded p-3 mt-4 mb-4"
            />

            <button
              onClick={processLyrics}
              className="bg-blue-900 text-yellow-400 px-6 py-2 rounded font-semibold"
            >
              Next
            </button>
          </div>
        )}

        {/* STEP 3 – Assign Lines */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              Assign Who Sings Each Line
            </h2>

            {assignments.map((line, i) => (
              <div key={i} className="flex justify-between mb-2 gap-4">
                <span className="flex-1">{line.text}</span>

                <select
                  value={line.singer}
                  onChange={(e) => {
                    const updated = [...assignments];
                    updated[i].singer = e.target.value;
                    setAssignments(updated);
                  }}
                  className="border p-1 rounded"
                >
                  {singers.map((s, idx) => (
                    <option key={idx} value={s || `Singer ${idx + 1}`}>
                      {s || `Singer ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <button
              onClick={() => setStep(4)}
              className="bg-blue-900 text-yellow-400 px-6 py-2 rounded mt-6 font-semibold"
            >
              Start Synchronizing
            </button>
          </div>
        )}

        {/* STEP 4 – Synchronization */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              Synchronize Lyrics
            </h2>

            <label className="font-semibold block mb-2">
              Sync Mode
            </label>

            <select
              value={syncMode}
              onChange={(e) => setSyncMode(e.target.value)}
              className="border p-2 rounded mb-4 w-full"
            >
              <option value="line">
                Press Space at Beginning of Each Line
              </option>
              <option value="word">
                Press Space at Every Word
              </option>
            </select>

            <audio
              ref={audioRef}
              src={audioURL}
              controls
              className="w-full mb-6"
            />

            <div className="space-y-2 mb-6">
              {syncItems.map((item, i) => (
                <span
                  key={i}
                  className={`inline-block mr-2 px-2 py-1 rounded ${
                    i < currentIndex
                      ? "bg-yellow-400 text-blue-950"
                      : "bg-gray-200"
                  }`}
                >
                  <strong>{item.singer}:</strong> {item.text}
                </span>
              ))}
            </div>

            <button
              onClick={exportJSON}
              className="bg-blue-900 text-yellow-400 px-6 py-2 rounded font-semibold"
            >
              Export Timing JSON
            </button>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="mt-10 text-center text-yellow-400">
        <p className="font-semibold">Brought to you by</p>
        <p className="text-xl font-bold">CKing Designs</p>
      </div>
    </div>
  );
}
