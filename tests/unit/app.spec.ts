import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CategoryChips from '@/components/CategoryChips.vue';
import { errorMessage } from '@/composables/useAppToast';
import {
  compressImageToDataUrl,
  isSupportedImageType,
  MAX_IMAGE_DATA_URL_LENGTH,
  MAX_IMAGE_FILE_SIZE,
} from '@/utils/imageCompression';

describe('CategoryChips', () => {
  it('emits the selected category', async () => {
    const wrapper = mount(CategoryChips, { props: { modelValue: '' } });
    await wrapper.findAll('ion-chip')[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Tropical']);
  });
});

describe('errorMessage', () => {
  it('shows a friendly message for invalid credentials', () => {
    expect(errorMessage(new Error('Firebase: Error (auth/invalid-credential).'))).toBe('Incorrect email or password.');
  });

  it('preserves useful service error messages', () => {
    expect(errorMessage(new Error('Supplier profile not found.'))).toBe('Supplier profile not found.');
  });

  it('explains that Firestore index errors are temporary or need deployment', () => {
    expect(errorMessage(new Error('The query requires an index. That index is currently building.'))).toContain(
      'still building',
    );
  });
});

describe('fruit photo uploads', () => {
  it('accepts browser-friendly image formats and rejects unsupported files', () => {
    expect(isSupportedImageType('image/jpeg')).toBe(true);
    expect(isSupportedImageType('image/PNG')).toBe(true);
    expect(isSupportedImageType('image/heic')).toBe(false);
  });

  it('keeps the encoded image safely below the Firestore document limit', () => {
    expect(MAX_IMAGE_DATA_URL_LENGTH).toBeLessThan(600_000);
  });

  it('rejects files that are not supported image types', async () => {
    const file = new File(['not an image'], 'notes.txt', { type: 'text/plain' });
    await expect(compressImageToDataUrl(file)).rejects.toThrow('Choose a JPG, PNG, or WebP image.');
  });

  it('rejects oversized source photos before decoding them', async () => {
    const file = new File([new Uint8Array(MAX_IMAGE_FILE_SIZE + 1)], 'large.jpg', { type: 'image/jpeg' });
    await expect(compressImageToDataUrl(file)).rejects.toThrow('Choose an image smaller than 15 MB.');
  });
});
