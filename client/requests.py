
import aiohttp 

async def get_json(url : str) -> dict:
    async with aiohttp.ClientSession() as s:
        async with s.get(url) as r:
            return await r.json()

async def post_json(url : str, data : dict):
    async with aiohttp.ClientSession() as s:
        async with s.post(url, data=data) as r:
            pass
