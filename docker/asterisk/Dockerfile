FROM andrius/asterisk:22

USER root

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates \
    odbc-postgresql \
    openssl \
    unixodbc \
    unixodbc-dev \
  && rm -rf /var/lib/apt/lists/*

COPY asterisk/ /etc/asterisk/
COPY docker/asterisk/odbc.ini /etc/odbc.ini
COPY docker/asterisk/odbcinst.ini /etc/odbcinst.ini
COPY docker/asterisk/entrypoint.sh /usr/local/bin/telephony-asterisk-entrypoint.sh

RUN chmod +x /usr/local/bin/telephony-asterisk-entrypoint.sh \
  && mkdir -p /etc/asterisk/keys /var/log/asterisk /var/spool/asterisk \
  && chown -R asterisk:asterisk /etc/asterisk /var/log/asterisk /var/spool/asterisk

EXPOSE 5060/udp 5060/tcp 5038 8088 8089 10000-20000/udp

ENTRYPOINT ["/usr/local/bin/telephony-asterisk-entrypoint.sh"]
CMD ["asterisk", "-f", "-U", "asterisk", "-G", "asterisk"]
