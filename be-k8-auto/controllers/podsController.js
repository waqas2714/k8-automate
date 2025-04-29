const fetchImages = async (req, res) => {
    const query = req.query.image;
    const response = await fetch(`https://hub.docker.com/v2/search/repositories/?query=${query}`);
    console.log(`https://hub.docker.com/v2/search/repositories/?query=${query}`);
    
    const data = await response.json();
    res.json(data);
}

const fetchTags = async (req, res) => {
    try {
      let image = req.query.image;
      if (!image) {
        return res.status(400).json({ error: 'Image name is required' });
      }
  
      // Remove tag if present (e.g., ubuntu:latest => ubuntu)
      image = image.split(':')[0];
  
      // Determine namespace and repo
      let namespace = 'library';
      let repo = image;
  
      if (image.includes('/')) {
        const parts = image.split('/');
        namespace = parts[0];
        repo = parts[1];
      }
  
      const response = await fetch(`https://hub.docker.com/v2/repositories/${namespace}/${repo}/tags?page_size=20`);
      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error('Error fetching tags:', err);
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  };
  

module.exports = {
    fetchImages,
    fetchTags
}