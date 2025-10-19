#!/usr/bin/env python3
"""
MongoDB Database Backup Script
Backs up all collections to JSON files
"""
import os
import sys
from pathlib import Path

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import asyncio
import json
from datetime import datetime
from bson import ObjectId

# Load environment
backend_dir = Path(__file__).parent / 'backend'
load_dotenv(backend_dir / '.env')

class JSONEncoder(json.JSONEncoder):
    """Custom JSON encoder for MongoDB objects"""
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

async def backup_database():
    """Backup all collections from MongoDB"""
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    if not mongo_url:
        print("ERROR: MONGO_URL not found in environment")
        return
    
    print(f"Connecting to database: {db_name}")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Create backup directory
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = Path(__file__).parent / f'database_backup_{timestamp}'
    backup_dir.mkdir(exist_ok=True)
    
    print(f"Backup directory: {backup_dir}")
    
    # Get all collections
    collections = await db.list_collection_names()
    print(f"\nFound {len(collections)} collections: {', '.join(collections)}")
    
    # Backup metadata
    metadata = {
        'backup_date': timestamp,
        'database_name': db_name,
        'collections': collections,
        'total_collections': len(collections)
    }
    
    # Backup each collection
    for collection_name in collections:
        print(f"\nBacking up collection: {collection_name}")
        collection = db[collection_name]
        
        # Get all documents
        documents = []
        cursor = collection.find({})
        async for doc in cursor:
            documents.append(doc)
        
        print(f"  - Found {len(documents)} documents")
        
        # Save to file
        output_file = backup_dir / f'{collection_name}.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(documents, f, cls=JSONEncoder, indent=2, ensure_ascii=False)
        
        print(f"  - Saved to: {output_file.name}")
        metadata[collection_name] = len(documents)
    
    # Save metadata
    metadata_file = backup_dir / 'backup_metadata.json'
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Backup completed successfully!")
    print(f"📁 Backup location: {backup_dir}")
    print(f"📊 Total documents backed up: {sum(metadata.get(c, 0) for c in collections)}")
    
    client.close()

if __name__ == '__main__':
    asyncio.run(backup_database())
