import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// Enhanced PDF.js worker configuration with fallbacks
const setupPDFWorker = () => {
  try {
    // Get the current origin to ensure we use the correct port
    const currentOrigin = window.location.origin
    // Primary: Use local worker file with correct origin
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${currentOrigin}/pdf.worker.min.js`
    console.log('📄 PDF.js worker configured with local file:', pdfjsLib.GlobalWorkerOptions.workerSrc)
  } catch (error) {
    console.warn('📄 Local PDF worker setup failed, trying CDN fallback:', error)
    try {
      // Fallback: Use CDN worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`
      console.log('📄 PDF.js worker configured with CDN fallback')
    } catch (cdnError) {
      console.error('📄 CDN PDF worker setup also failed:', cdnError)
      // Final fallback: Use inline worker (less efficient but works)
      pdfjsLib.GlobalWorkerOptions.workerSrc = `data:application/javascript;base64,${btoa('importScripts("https://cdn.jsdelivr.net/npm/pdfjs-dist@' + pdfjsLib.version + '/build/pdf.worker.min.js");')}`
      console.log('📄 PDF.js worker configured with inline fallback')
    }
  }
}

// Initialize PDF worker
setupPDFWorker()

// Add version logging for debugging
console.log('📄 PDF.js API version:', pdfjsLib.version)
console.log('📄 Worker source:', pdfjsLib.GlobalWorkerOptions.workerSrc)

export interface ProcessedFile {
  text: string
  wordCount: number
  pageCount: number
  fileName: string
  fileSize: number
  fileType: string
}

export class FileProcessor {
  static async processFile(file: File): Promise<ProcessedFile> {
    try {
      console.log('🔄 Processing file:', file.name, 'Type:', file.type, 'Size:', file.size)
      
      // Enhanced file validation
      this.validateFile(file)
      
      let text = ''
      let pageCount = 1
      const fileType = file.type
      
      // Add fallback file type detection based on file extension
      let detectedType = fileType
      if (!detectedType || detectedType === 'application/octet-stream') {
        const fileName = file.name.toLowerCase()
        if (fileName.endsWith('.pdf')) {
          detectedType = 'application/pdf'
        } else if (fileName.endsWith('.docx')) {
          detectedType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
        console.log('📄 File type detection fallback:', detectedType)
      }
      
      if (detectedType === 'application/pdf') {
        console.log('📄 Processing as PDF...')
        const result = await this.processPDF(file)
        text = result.text
        pageCount = result.pageCount
      } else if (detectedType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        console.log('📄 Processing as DOCX...')
        const result = await this.processDOCX(file)
        text = result.text
        pageCount = result.pageCount
      } else {
        console.error('❌ Unsupported file type:', detectedType, 'Original type:', fileType)
        throw new Error(`Unsupported file type: ${detectedType}. Please upload a PDF or DOCX file.`)
      }
      
      // Enhanced text validation
      if (!text || text.trim().length === 0) {
        console.error('❌ No text extracted from file')
        throw new Error('No text could be extracted from the uploaded file. Please ensure the file contains readable text and is not corrupted.')
      }
      
      // Calculate word count with better text processing
      const cleanText = text.replace(/\s+/g, ' ').trim()
      const words = cleanText.split(/\s+/).filter(word => word.length > 0)
      const wordCount = words.length
      
      // Additional validation
      if (wordCount === 0) {
        console.error('❌ No words found in extracted text')
        throw new Error('No readable words found in the document. Please check if the file contains text content.')
      }
      
      if (wordCount < 10) {
        console.warn('⚠️ Very few words extracted, this may indicate an issue with the document')
      }
      
      console.log('✅ File processed successfully:', {
        fileName: file.name,
        originalType: fileType,
        detectedType,
        textLength: text.length,
        wordCount,
        pageCount,
        firstWords: words.slice(0, 10).join(' ') + (words.length > 10 ? '...' : '')
      })
      
      return {
         text: cleanText,
         wordCount,
         pageCount,
         fileName: file.name,
         fileSize: file.size,
         fileType: detectedType
       }
    } catch (error) {
      console.error('❌ File processing failed for:', file.name, error)
      
      // Enhanced error reporting
      if (error instanceof Error) {
        // Add context to the error message
        const contextualError = new Error(`Failed to process "${file.name}": ${error.message}`)
        contextualError.name = error.name
        throw contextualError
      }
      
      throw new Error(`Failed to process "${file.name}": Unknown error occurred`)
    }
  }

  private static async processPDF(file: File): Promise<{ text: string; pageCount: number }> {
    try {
      console.log('📄 Starting PDF processing for file:', file.name, 'Size:', file.size, 'Type:', file.type)
      
      // Validate file is actually a PDF
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('File does not appear to be a valid PDF')
      }
      
      const arrayBuffer = await file.arrayBuffer()
      console.log('📄 ArrayBuffer created, size:', arrayBuffer.byteLength)
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('PDF file appears to be empty')
      }
      
      // Enhanced PDF.js configuration for better compatibility
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
        // Disable font face loading to avoid issues
        disableFontFace: false,
        // Enable range requests for better performance
        disableRange: false,
        // Disable streaming for better compatibility
        disableStream: true
      })
      
      const pdf = await loadingTask.promise
      const pageCount = pdf.numPages
      console.log('📄 PDF loaded successfully, pages:', pageCount)
      
      if (pageCount === 0) {
        throw new Error('PDF contains no pages')
      }
      
      let text = ''
      let totalExtractedChars = 0

      for (let i = 1; i <= pageCount; i++) {
        try {
          console.log(`📄 Processing page ${i}/${pageCount}`)
          const page = await pdf.getPage(i)
          
          // Get text content
          const textContent = await page.getTextContent()
          
          console.log(`📄 Page ${i} has ${textContent.items.length} text items`)
          
          // Enhanced text extraction with multiple strategies
          let pageText = ''
          
          // Strategy 1: Standard text extraction
          const standardText = textContent.items
            .filter((item: any) => item.str && typeof item.str === 'string' && item.str.trim().length > 0)
            .map((item: any) => {
              // Clean and normalize text
              let str = item.str.trim()
              // Handle common PDF text issues
              str = str.replace(/\s+/g, ' ') // Normalize whitespace
              str = str.replace(/[\u00A0\u2000-\u200B\u2028\u2029]/g, ' ') // Replace various space characters
              return str
            })
            .filter(str => str.length > 0)
            .join(' ')
          
          pageText = standardText
          
          // Strategy 2: If no text found, try alternative extraction
          if (pageText.length === 0) {
            console.warn(`📄 Page ${i} - Standard extraction failed, trying alternative method`)
            
            // Try to extract all items including those without str property
            const alternativeText = textContent.items
              .map((item: any) => {
                if (item.str) return item.str.trim()
                if (item.chars) return item.chars.map((c: any) => c.c || c.char || '').join('').trim()
                return ''
              })
              .filter(str => str.length > 0)
              .join(' ')
            
            pageText = alternativeText
          }
          
          // Strategy 3: If still no text, check for form fields or annotations
          if (pageText.length === 0) {
            console.warn(`📄 Page ${i} - Alternative extraction failed, checking for form fields`)
            
            try {
              const annotations = await page.getAnnotations()
              const formText = annotations
                .filter((ann: any) => ann.fieldValue || ann.contents)
                .map((ann: any) => ann.fieldValue || ann.contents)
                .filter(text => text && text.trim().length > 0)
                .join(' ')
              
              if (formText.length > 0) {
                pageText = formText
                console.log(`📄 Page ${i} - Extracted text from form fields/annotations`)
              }
            } catch (annotationError) {
              console.warn(`📄 Page ${i} - Form field extraction failed:`, annotationError)
            }
          }
          
          if (pageText.length > 0) {
            text += pageText + '\n'
            totalExtractedChars += pageText.length
            console.log(`📄 Page ${i} extracted ${pageText.length} characters`)
          } else {
            console.warn(`📄 Page ${i} extracted no text - this may be an image-only page`)
          }
          
        } catch (pageError) {
          console.error(`📄 Error processing page ${i}:`, pageError)
          // Continue with other pages even if one fails
          continue
        }
      }

      const finalText = text.trim()
      console.log('📄 PDF processing complete. Total text length:', finalText.length)
      console.log('📄 Total characters extracted:', totalExtractedChars)
      console.log('📄 First 200 characters:', finalText.substring(0, 200))
      console.log('📄 Last 200 characters:', finalText.length > 200 ? finalText.substring(finalText.length - 200) : 'N/A')
      
      // Enhanced validation
      if (finalText.length === 0) {
        console.error('📄 No text could be extracted from any page of the PDF')
        throw new Error('No text could be extracted from the PDF. This may be a scanned document or image-based PDF that requires OCR processing.')
      }
      
      if (finalText.length < 10) {
        console.warn('📄 Very little text extracted, this may indicate an issue with the PDF')
      }
      
      return { text: finalText, pageCount }
    } catch (error) {
      console.error('📄 PDF processing error:', error)
      
      // Enhanced error handling with specific error types
      if (error instanceof Error) {
        if (error.message.includes('worker')) {
          throw new Error('PDF worker failed to load. Please refresh the page and try again.')
        } else if (error.message.includes('Invalid PDF')) {
          throw new Error('The uploaded file is not a valid PDF document.')
        } else if (error.message.includes('password')) {
          throw new Error('This PDF is password protected. Please upload an unprotected version.')
        } else if (error.message.includes('corrupted')) {
          throw new Error('The PDF file appears to be corrupted. Please try uploading a different file.')
        } else if (error.message.includes('No text could be extracted')) {
          // Re-throw our custom message
          throw error
        } else {
          throw new Error(`Failed to process PDF: ${error.message}`)
        }
      }
      
      throw new Error('Failed to process PDF: Unknown error occurred')
    }
  }

  private static async processDOCX(file: File): Promise<{ text: string; pageCount: number }> {
    try {
      console.log('📄 Starting DOCX processing for file:', file.name, 'Size:', file.size, 'Type:', file.type)
      
      // Validate file is actually a DOCX
      if (!file.type.includes('wordprocessingml') && !file.name.toLowerCase().endsWith('.docx')) {
        throw new Error('File does not appear to be a valid DOCX document')
      }
      
      const arrayBuffer = await file.arrayBuffer()
      console.log('📄 ArrayBuffer created, size:', arrayBuffer.byteLength)
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('DOCX file appears to be empty')
      }
      
      // Enhanced mammoth options for better text extraction
      const options = {
        arrayBuffer,
        // Convert images to alt text if available
        convertImage: mammoth.images.imgElement(function(image: any) {
          return image.read("base64").then(function(imageBuffer: any) {
            return {
              src: "data:" + image.contentType + ";base64," + imageBuffer
            }
          })
        })
      }
      
      // Try multiple extraction strategies
      let text = ''
      let extractionMethod = ''
      
      try {
        // Strategy 1: Extract raw text (fastest, most reliable)
        console.log('📄 Attempting raw text extraction...')
        const rawResult = await mammoth.extractRawText(options)
        text = rawResult.value.trim()
        extractionMethod = 'raw text'
        
        if (rawResult.messages && rawResult.messages.length > 0) {
          console.warn('📄 DOCX extraction warnings:', rawResult.messages)
        }
        
      } catch (rawError) {
        console.warn('📄 Raw text extraction failed, trying HTML extraction:', rawError)
        
        // Strategy 2: Extract as HTML then strip tags
        try {
          console.log('📄 Attempting HTML extraction...')
          const htmlResult = await mammoth.convertToHtml(options)
          
          // Strip HTML tags and decode entities
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = htmlResult.value
          text = tempDiv.textContent || tempDiv.innerText || ''
          text = text.trim()
          extractionMethod = 'HTML conversion'
          
          if (htmlResult.messages && htmlResult.messages.length > 0) {
            console.warn('📄 DOCX HTML extraction warnings:', htmlResult.messages)
          }
          
        } catch (htmlError) {
          console.error('📄 HTML extraction also failed:', htmlError)
          throw new Error('Failed to extract text using both raw and HTML methods')
        }
      }
      
      console.log(`📄 DOCX processing complete using ${extractionMethod}. Text length:`, text.length)
      console.log('📄 First 200 characters:', text.substring(0, 200))
      console.log('📄 Last 200 characters:', text.length > 200 ? text.substring(text.length - 200) : 'N/A')
      
      // Enhanced validation
      if (text.length === 0) {
        console.error('📄 No text could be extracted from the DOCX document')
        throw new Error('No text could be extracted from the DOCX document. The file may be corrupted or contain only images.')
      }
      
      if (text.length < 10) {
        console.warn('📄 Very little text extracted from DOCX, this may indicate an issue')
      }
      
      // Enhanced word counting with better text processing
      const cleanText = text
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces for better word counting
        .trim()
      
      const words = cleanText.split(/\s+/).filter(word => word.length > 0)
      const wordCount = words.length
      
      console.log('📄 Word count:', wordCount)
      
      // Estimate page count (rough approximation: 500 words per page)
      const estimatedPageCount = Math.max(1, Math.ceil(wordCount / 500))
      
      console.log('📄 Estimated page count:', estimatedPageCount)
      
      return { text, pageCount: estimatedPageCount }
    } catch (error) {
      console.error('📄 DOCX processing error:', error)
      
      // Enhanced error handling
      if (error instanceof Error) {
        if (error.message.includes('not a valid DOCX')) {
          throw error
        } else if (error.message.includes('No text could be extracted')) {
          throw error
        } else if (error.message.includes('corrupted')) {
          throw new Error('The DOCX file appears to be corrupted. Please try uploading a different file.')
        } else if (error.message.includes('password')) {
          throw new Error('This DOCX file may be password protected. Please upload an unprotected version.')
        } else {
          throw new Error(`Failed to process DOCX: ${error.message}`)
        }
      }
      
      throw new Error('Failed to process DOCX: Unknown error occurred')
    }
  }



  static validateFile(file: File): { isValid: boolean; message: string } {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        message: 'Please upload a PDF or DOCX file only.'
      }
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        message: 'File size must be less than 10MB.'
      }
    }

    if (file.size === 0) {
      return {
        isValid: false,
        message: 'File appears to be empty.'
      }
    }

    return {
      isValid: true,
      message: 'File is valid.'
    }
  }
}