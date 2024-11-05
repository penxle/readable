<script lang="ts" module>
  import ky from 'ky';
  import { graphql } from '$graphql';

  const issueBlobUploadUrl = graphql(`
    mutation BlobUtils_IssueBlobUploadUrl($input: IssueBlobUploadUrlInput!) {
      issueBlobUploadUrl(input: $input) {
        path
        url
        fields
      }
    }
  `);

  const persistBlobAsFile = graphql(`
    mutation BlobUtils_PersistBlobAsFile($input: PersistBlobAsFileInput!) {
      persistBlobAsFile(input: $input) {
        id
      }
    }
  `);

  const persistBlobAsImage = graphql(`
    mutation BlobUtils_PersistBlobAsImage($input: PersistBlobAsImageInput!) {
      persistBlobAsImage(input: $input) {
        id
        ...Img_image
      }
    }
  `);

  const uploadBlob = async (file: File) => {
    const { path, url, fields } = await issueBlobUploadUrl({ filename: file.name });

    const formData = new FormData();
    for (const [key, value] of Object.entries<string>(fields)) {
      formData.append(key, value);
    }

    formData.append('Content-Type', file.type);
    formData.append('file', file);

    await ky.post(url, { body: formData });

    return path;
  };

  export const uploadBlobAsFile = async (file: File) => {
    const path = await uploadBlob(file);
    return await persistBlobAsFile({ path });
  };

  export const uploadBlobAsImage = async (file: File, modification?: unknown) => {
    const path = await uploadBlob(file);
    return await persistBlobAsImage({ path, modification });
  };
</script>
