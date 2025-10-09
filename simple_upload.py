from fastapi import FastAPI, File, UploadFile
from typing import List
import base64

app = FastAPI()

@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    result = []
    
    for file in files:
        # Read file
        content = await file.read()
        
        # Convert to base64
        base64_str = base64.b64encode(content).decode()
        
        # Create data URL
        if file.filename.lower().endswith(('.jpg', '.jpeg')):
            mime = "image/jpeg"
        elif file.filename.lower().endswith('.png'):
            mime = "image/png"
        elif file.filename.lower().endswith('.gif'):
            mime = "image/gif"
        else:
            mime = "image/jpeg"
        
        data_url = f"data:{mime};base64,{base64_str}"
        
        result.append({
            "name": file.filename,
            "url": data_url,
            "size": len(content)
        })
    
    return {"success": True, "images": result}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)