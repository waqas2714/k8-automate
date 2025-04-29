import React, { useState, useCallback } from 'react';
import Dashboard from '../components/Dashboard';
import { toast } from 'react-toastify';
import useDebounce from '../hooks/useDebounce';

const CreatePods = () => {
  const [podName, setPodName] = useState('');
  const [containerName, setContainerName] = useState('');
  const [image, setImage] = useState('');
  const [tag, setTag] = useState('latest');
  const [port, setPort] = useState('');
  const [command, setCommand] = useState('');
  const [namespace, setNamespace] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [imageSuggestions, setImageSuggestions] = useState([]);
  const [isImageListOpen, setIsImageListOpen] = useState(false); // For managing visibility of image list
  const [isTagListOpen, setIsTagListOpen] = useState(false); // For managing visibility of tag list

  const fetchImages = useCallback(async (query) => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/pods/fetch-images?image=${query}`);
    const data = await res.json();
    const results = data.results?.map(repo => repo.repo_name) || [];
    setImageSuggestions(results);
    setIsImageListOpen(true); // Open the image suggestion list
    return results;
  }, []);

  useDebounce(image.trim(), fetchImages, 1000);

  const fetchTagsForImage = useCallback(async (imageName) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/pods/fetch-tags?image=${imageName}`);
      const data = await res.json();
      const results = data.results?.map(tag => tag.name) || [];
      setTagSuggestions(results);
      setIsTagListOpen(true); // Open the tag suggestion list
    } catch (error) {
      toast.error('Failed to fetch tags for image:', imageName, error);
      setTagSuggestions([]);
      setIsTagListOpen(false); // Close tag list on error
    }
  }, []);

  const handleImageSelect = (img) => {
    setImage(img);
    setIsImageListOpen(false); // Close image suggestion list
    fetchTagsForImage(img);
  };

  const handleTagSelect = (selectedTag) => {
    setTag(selectedTag);
    setIsTagListOpen(false); // Close tag suggestion list
  };

  const handleCreatePod = () => {
    if (!image.trim()) {
      toast.error('Container image is required!');
      return;
    }

    const finalImage = image.includes(':') ? image : `${image}:${tag || 'latest'}`;

    const podSpec = {
      podName: podName || containerName || finalImage.replace(/[^a-z0-9]/gi, '-'),
      containerName: containerName || podName || 'default-container',
      image: finalImage,
      port,
      command,
      namespace,
    };

    console.log('Creating Pod with spec:', podSpec);
    toast.success('Pod creation triggered (stub).');
  };

  return (
    <Dashboard>
      <div className="p-6 flex flex-col justify-center items-center">
        <h2 className="text-center text-4xl font-semibold mb-6">Create a Kubernetes Pod</h2>
        <div className="w-full flex flex-wrap justify-center gap-x-4 gap-y-6">
          <input
            type="text"
            placeholder="Pod Name (optional)"
            value={podName}
            onChange={(e) => setPodName(e.target.value)}
            className="border rounded w-[80%] sm:w-[45%] p-2"
          />
          <input
            type="text"
            placeholder="Container Name (optional)"
            value={containerName}
            onChange={(e) => setContainerName(e.target.value)}
            className="border rounded w-[80%] sm:w-[45%] p-2"
          />

          {/* Image Input with Debounce */}
          <div className="relative w-[80%] sm:w-[45%]">
            <input
              type="text"
              placeholder="Container Image (e.g. nginx)"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="border rounded w-full p-2"
              required
            />
            {isImageListOpen && imageSuggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border mt-1 rounded shadow w-full max-h-48 overflow-auto">
                {imageSuggestions.map((img) => (
                  <li
                    key={img}
                    onClick={() => handleImageSelect(img)}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-black"
                  >
                    {img}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tag Input (Disabled) */}
          <div className="relative w-[80%] sm:w-[45%]">
            <input
              type="text"
              placeholder="Image Tag"
              value={tag}
              disabled
              className="border rounded w-full p-2 bg-gray-100 cursor-not-allowed text-gray-600"
            />
            {isTagListOpen && tagSuggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border mt-1 rounded shadow w-full max-h-48 overflow-auto">
                {tagSuggestions.map((t) => (
                  <li
                    key={t}
                    onClick={() => handleTagSelect(t)}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <input
            type="number"
            placeholder="Container Port (optional)"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            className="border rounded w-[80%] sm:w-[45%] p-2"
          />
          <input
            type="text"
            placeholder="Command (optional)"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="border rounded w-[80%] sm:w-[45%] p-2"
          />
          <input
            type="text"
            placeholder="Namespace (optional)"
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
            className="border rounded w-[80%] sm:w-[45%] p-2"
          />
        </div>
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleCreatePod}
            className="text-white bg-[#2A2F35] hover:bg-[#F7F7F7] hover:text-[#2A2F35] hover:border hover:border-[#2A2F35] rounded p-4 transition-all cursor-pointer"
          >
            Create Pod
          </button>
        </div>
      </div>
    </Dashboard>
  );
};

export default CreatePods;
