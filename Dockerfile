# set base image (host OS)
FROM python:3.8

RUN rm /bin/sh && ln -s /bin/bash /bin/sh

RUN apt-get -y update
RUN apt-get install -y curl nano wget nginx git

# Keep pip compatible with the legacy dependency metadata in requirements.txt
RUN python -m pip install "pip<24.1"


ENV ENV_TYPE staging
ENV MONGO_HOST mongo
ENV MONGO_PORT 27017
##########

ENV PYTHONPATH=$PYTHONPATH:/src/

CMD ["bash", "-c", "cd /src/rest && gunicorn --bind 0.0.0.0:${PORT:-8000} rest.wsgi:application"]

# copy the dependencies file to the working directory
COPY src/requirements.txt .

# install dependencies
RUN pip install -r requirements.txt

COPY src /src
