import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

export async function uploadResume(file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  
  // Get signed URL first
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('agency')
    .createSignedUploadUrl(fileName);
    
  if (signedUrlError) {
    console.error('Signed URL error:', signedUrlError);
    throw signedUrlError;
  }
  
  // Upload using signed URL
  const uploadResponse = await fetch(signedUrlData.signedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    }
  });
  
  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.statusText}`);
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('agency')
    .getPublicUrl(fileName);
    
  return urlData.publicUrl;
}