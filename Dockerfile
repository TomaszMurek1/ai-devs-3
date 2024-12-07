FROM node:22.11.0-bullseye-slim

# Install required system dependencies
RUN apt update && \
    apt install -y libcairo2-dev libpango1.0-dev curl unzip make build-essential

# Install Bun and add its global binary directory to PATH
RUN curl -fsSL https://bun.sh/install | bash && \
    cp /root/.bun/bin/bun /usr/bin && \
    echo 'export PATH="/root/.bun/bin:$PATH"' >> /root/.bashrc

# Set environment variables
ENV PATH="/root/.bun/bin:$PATH"
ENV PKG_CONFIG_PATH=/usr/lib/pkgconfig

# Copy application files
COPY . /app

# Set working directory
WORKDIR /app

# Install dependencies
RUN bun install && bun pm trust --all || true

# Rebuild specific native modules if necessary
RUN cd /app/node_modules/promptfoo && bun install || npm rebuild better-sqlite3

# Install promptfoo globally
RUN bun add promptfoo -g

# Keep the container running for debugging purposes
CMD ["bash", "-c", "while true; do sleep infinity; done"]
