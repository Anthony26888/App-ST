# Build image multi-arch
docker buildx build --platform linux/arm/v7 -t frontend:latest ./frontend --load
docker buildx build --platform linux/arm/v7 -t backend:latest ./backend --load

# Save to tar
docker save frontend:latest -o frontend.tar
docker save backend:latest -o backend.tar

# Copy to Raspberry Pi (thay IP và user nếu cần)
scp frontend.tar sieuthuat@sieuthuat.local:/home/sieuthuat/
scp backend.tar sieuthuat@sieuthuat.local:/home/sieuthuat/

