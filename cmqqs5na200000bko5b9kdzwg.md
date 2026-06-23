---
title: "Handling Networking Certs for Fortigates"
seoTitle: "Handling Networking Certificates for Fortigates"
seoDescription: "Handling Networking Certificates for Fortigates"
datePublished: 2026-06-23T15:09:24.149Z
cuid: cmqqs5na200000bko5b9kdzwg
slug: handling-networking-certs-for-fortigates
tags: certificates, fortigate, fortinet

---

* * *

## Introduction

This is a general overview of how to handle certificate renewals both from CSR creation, and when handed different types of certificate files. Each section will have a type of certificate, and explain how to convert it for use on a Fortigate. I've also included links below for reading. The easiest way is always to generate a CSR (Certificate Signing Request) from the firewall, and sign it from a Certificate Vendor (e.g. GoDaddy, Network Solutions, etc), but you won't always be able to do that.

* * *

## Generate the CSR

This is by far the easiest way to get a certificate to work on a Fortigate. This has you generate a CSR from the firewall, and sign it via an SSL Certificate Vendor/Authority. We're going to use the WebGUI for this as it's 100x easier, but if you want to do it via CLI then that's fine too.

*   Log into the Fortigate via WebGUI (e.g. https://192.168.1.99)
    
*   Go to System
    
*   Go to Certificates
    
*   Click Generate
    
*   Enter Certificate Name (e.g. sslvpn.thepracticalpacket.com-2026)
    
*   Set the Key Type to RSA
    
*   Set the Key Size to 2048 Bit
    
*   Select the domain name and type in the FQDN (e.g. sslvpn.thepracticalpacket.com)
    
*   Fill in the rest of the information as needed (none of it is NEEDED reaslly)
    
*   Select the Enrollment Method as File Based
    
*   Click OK
    
*   To save the .csr file to your drive, highlight the "pending" certificate and select Download
    
*   Log into your Certificate Vendor/Authority (e.g. Godaddy)
    
*   You can follow the instructions in the links section for vendor specific ways to get CSRs signed
    

* * *

## Converting from a .crt + .key to PKCS#12 for Importing

When you aren't able to generate your own private key and get a CSR signed, sometimes you will be provided a certificate file and a private key file. The easiest way to import this is to convert it to an encrypted PKCS12 formatted file using OpenSSL.

*   Download OpenSSL from the link below (Choose the Win64 OpenSSL v4.0.1 version if you're using Windows and you're not sure)
    
*   Prepare to convert by gathering the location of your certificate (.crt) file and your private key file (e.g. c:/Temp/certificate.crt)
    
*   Open a Windows Explorer window (Win+E) and go to C:\\Program Files\\OpenSSL-Win64 (or wherever you installed OpenSSL)
    
*   Shift right click on the blank space while inside the folder and choose "Open Powershell here"
    
*   For this example, we'll assume the certificate file is named server.crt, and the private key file is named server.key, and the PKCS#12 file you want will be named server.p12
    
*   Type the following: .\\openssl.exe pkcs12 -export -out server.p12 -inkey server.key -in server.crt
    
*   It will ask you for a password. Make sure you use a strong password and document it somewhere safe!
    
*   This will import your private key and certificate, and then export it as a PKCS12 formatted file
    

* * *

## Applying a PKCS#12/PFX Certificate to the Firewall

Adding a PKCS12 (also known as a PFX) Certificate to a firewall is simple once you have it.

*   Log into the Fortigate via WebGUI (e.g. https://192.168.1.99)
    
*   Go to System
    
*   Go to Certificates
    
*   Click on Import
    
*   Click on Local Certificate
    
*   Click on PKCS#12 Certificate
    
*   Browse to the PKCS12 formatted file you created or were given
    
*   Type the password you created or were given with the file
    
*   Click Okay
    
*   You are now ready to use this for SSLVPN or anything else you need certificates for
    

* * *

## More Learning

*   OpenSSL Download - https://slproweb.com/products/Win32OpenSSL.html
    
*   GoDaddy Cerificates - https://www.godaddy.com/help/set-up-and-install-my-standard-dv-ssl-certificate-42480
    
*   Network Solutions Certificates - https://www.networksolutions.com/help/article/get-started-with-ssl