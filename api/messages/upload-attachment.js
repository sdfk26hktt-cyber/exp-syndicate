const linqApiKey = process.env.LINQ_API_KEY || 'linq_8g9j8emFbtz7k9WUH4LY9Capp8Wo6no2';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { filename, contentType, base64Data, dataUrl } = req.body || {};

    let rawBase64 = base64Data;
    let mimeType = contentType || 'image/jpeg';

    if (dataUrl && typeof dataUrl === 'string' && dataUrl.includes(',')) {
      const parts = dataUrl.split(',');
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
      rawBase64 = parts[1];
    }

    // Determine clean file extension from mimeType
    const ext = mimeType.includes('png') ? '.png'
      : mimeType.includes('webp') ? '.webp'
      : mimeType.includes('gif') ? '.gif'
      : '.jpg';

    let safeFilename = (filename || `attachment-${Date.now()}${ext}`)
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!safeFilename.includes('.')) safeFilename += ext;

    if (!rawBase64) {
      return res.status(400).json({ error: 'No image data provided. Please provide base64Data or dataUrl.' });
    }

    const fileBuffer = Buffer.from(rawBase64, 'base64');
    const sizeBytes = fileBuffer.length;

    if (sizeBytes > 25 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds maximum limit of 25MB.' });
    }

    // Step 1: Request presigned upload URL from LinqApp Partner API v3
    const initResponse = await fetch('https://api.linqapp.com/api/partner/v3/attachments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${linqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: safeFilename,
        content_type: mimeType,
        size_bytes: sizeBytes
      })
    });

    if (!initResponse.ok) {
      const errText = await initResponse.text();
      console.error('Failed to init Linq attachment:', initResponse.status, errText);
      return res.status(initResponse.status).json({
        error: `LinqApp Attachment Init failed (${initResponse.status}): ${errText}`
      });
    }

    const initData = await initResponse.json();
    const { upload_url, attachment_id, required_headers, download_url } = initData || {};

    if (!upload_url) {
      return res.status(500).json({ error: 'LinqApp did not return an upload_url.' });
    }

    // Step 2: Upload raw binary buffer to presigned S3 upload_url
    const uploadHeaders = {
      'Content-Type': mimeType,
      'Content-Length': String(sizeBytes),
      ...(required_headers || {})
    };

    const s3Response = await fetch(upload_url, {
      method: 'PUT',
      headers: uploadHeaders,
      body: fileBuffer
    });

    if (!s3Response.ok) {
      const s3Err = await s3Response.text();
      console.error('Failed to upload binary to Linq S3:', s3Response.status, s3Err);
      return res.status(s3Response.status).json({
        error: `S3 Direct Upload failed (${s3Response.status}): ${s3Err}`
      });
    }

    return res.status(200).json({
      success: true,
      attachment_id,
      download_url: download_url || `https://cdn.linqapp.com/attachments/${attachment_id}/${safeFilename}`,
      filename: safeFilename,
      contentType: mimeType,
      sizeBytes
    });
  } catch (error) {
    console.error('Error handling attachment upload:', error);
    return res.status(500).json({ error: error.message || 'Internal server error during upload.' });
  }
}
