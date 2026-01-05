const https = require('https');
const fs = require('fs');

const API_KEY = process.env.YOUTUBE_API_KEY;
const PLAYLIST_ID = process.env.PLAYLIST_ID;

const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${PLAYLIST_ID}&key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            
            if (jsonData.error) {
                console.error('API Error:', jsonData.error);
                process.exit(1);
            }
            
            // Filter and format video data
            const videoList = jsonData.items
                .filter(item => {
                    return item.snippet && 
                           item.snippet.title !== 'Private video' &&
                           item.snippet.title !== 'Deleted video' &&
                           item.snippet.thumbnails &&
                           item.contentDetails &&
                           item.contentDetails.videoId;
                })
                .map(item => ({
                    videoId: item.contentDetails.videoId,
                    title: item.snippet.title,
                    channel: item.snippet.channelTitle || 'Unknown Channel',
                    thumbnail: item.snippet.thumbnails.medium?.url || 
                              item.snippet.thumbnails.default?.url || 
                              'https://via.placeholder.com/320x180?text=No+Thumbnail',
                    embedUrl: `https://www.youtube.com/embed/${item.contentDetails.videoId}`
                }));
            
            // Save to JSON file with metadata
            const output = {
                lastUpdated: new Date().toISOString(),
                totalVideos: videoList.length,
                videos: videoList
            };
            
            fs.writeFileSync('videos.json', JSON.stringify(output, null, 2));
            console.log(`✅ Successfully saved ${videoList.length} videos to videos.json`);
            
        } catch (error) {
            console.error('Error parsing response:', error);
            process.exit(1);
        }
    });
}).on('error', (error) => {
    console.error('Request error:', error);
    process.exit(1);
});
