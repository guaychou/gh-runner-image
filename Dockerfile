# Only for create user
FROM registry.access.redhat.com/ubi8/ubi-minimal:8.4-210 as uadm
RUN microdnf install -y shadow-utils \
    && groupadd docker --gid 997 \
    && useradd -s /bin/bash ansible -u 3001 -m -d /opt/ansible \
    && usermod -aG docker ansible

# Final image
FROM registry.access.redhat.com/ubi8/ubi-minimal:8.4-210

LABEL name="Github Action Runner S6" \
      maintainer="Kevin Harnanta <crossmajor99@gmail.com>" \
      version="0.1.0" \
      description="Github Runner Action with S6 overlay"

ENV ANSIBLE_HOME="/opt/ansible"               \
    RUNNER_PATH=/opt/runner                   \
    RUNNER_WORKSPACE=/opt/runner_workspace    \
    S6_SERVICES_GRACETIME=15000               \
    S6_KILL_GRACETIME=15000                   \
    S6_READ_ONLY_ROOT=1                       \
    S6_KILL_FINISH_MAXTIME=15000              \
    NODEJS_VERSION=14                         \
    PYTHON_VERSION=3.9                        \
    DOCKERVERSION=20.10.9                     \
    PY_COLORS=1                               \
    ANSIBLE_FORCE_COLOR=1                     \
    PATH="/opt/ansible/.local/bin:${PATH}"    \
    TZ="Asia/Jakarta"

ADD https://github.com/just-containers/s6-overlay/releases/download/v2.2.0.3/s6-overlay-amd64.tar.gz /tmp/s6-overlay-amd64.tar.gz
ADD https://github.com/actions/runner/releases/download/v2.283.3/actions-runner-linux-x64-2.283.3.tar.gz /tmp/runner.tar.gz

# Disable NodeJS default module
RUN microdnf module enable python39 nodejs:14
# Installing github runner depedency
RUN microdnf install --nodocs -y     \
        tar                          \
        tzdata                       \
        gzip                         \
        userspace-rcu                \
        lttng-ust                    \
        libicu                       \
        unzip                        \
        openssh-clients              \
        nodejs                       \
        git                          \
        python${PYTHON_VERSION}    &&\
    tar xzf /tmp/s6-overlay-amd64.tar.gz -C / --exclude="./bin" &&    \
    tar xzf /tmp/s6-overlay-amd64.tar.gz -C /usr ./bin &&             \
    mkdir -p ${RUNNER_PATH} &&                                        \
    mkdir -p ${RUNNER_WORKSPACE} &&                                   \
    echo "${PATH}" > /etc/environment &&                              \
    tar -xzf /tmp/runner.tar.gz -C ${RUNNER_PATH}

RUN curl -fsSLO https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKERVERSION}.tgz \
    && tar xzvf docker-${DOCKERVERSION}.tgz --strip 1 \
       -C /usr/bin docker/docker \
    && rm docker-${DOCKERVERSION}.tgz

# Copy pip requirements
COPY requirements.txt requirements.txt

# Do Copy Gh runner service
COPY --from=uadm /etc/passwd /etc/passwd
COPY --from=uadm /etc/group /etc/group
COPY --from=uadm --chown=ansible /opt/ansible /opt/ansible
COPY cont-init.d /etc/cont-init.d
COPY cont-finish.d /etc/cont-finish.d
COPY services.d /etc/services.d
COPY src/ ${ANSIBLE_HOME}/.github/auther

# Fixing permission to run as user ansible
RUN  chown -R ansible:ansible ${RUNNER_PATH}                    \
     && chown -R ansible:ansible ${RUNNER_WORKSPACE}            \
     && chown -R ansible:ansible ${ANSIBLE_HOME}/.github/auther \
     && mkdir /var/run/s6                                       \
     && chown -R ansible:ansible /var/run/s6                    \
     && chmod -R ug+rwx /var/run/s6                             
    
# Installing Github Auther depedency   
RUN npm install -g ${ANSIBLE_HOME}/.github/auther

USER ansible
# Upgrade pip
RUN python3 -m pip install --no-cache-dir --upgrade pip --user
# Install depedency from requirements.txt
RUN python3 -m pip install --no-cache-dir -r requirements.txt --user

USER root
# Clean residual build
RUN rm -rf /tmp/* requirements.txt && \
    microdnf clean all

USER ansible
WORKDIR ${ANSIBLE_HOME}
ENTRYPOINT ["/init"]