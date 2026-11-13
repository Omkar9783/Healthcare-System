import defusedxml.ElementTree as ET
from xml.etree.ElementTree import Element
from typing import Dict, Any, Optional

class XMLParser:
    @staticmethod
    def parse_ekyc_xml(xml_content: str) -> Optional[Element]:
        """
        Safely parses UIDAI Offline e-KYC XML string using defusedxml.
        """
        try:
            return ET.fromstring(xml_content)
        except Exception as e:
            print(f"⚠️ XML Parsing error: {e}")
            return None

    @staticmethod
    def extract_node_data(root: Element) -> Dict[str, Any]:
        """
        Extracts Poi (Proof of Identity), Poa (Proof of Address), and Signature blocks.
        """
        extracted = {}
        if root is None:
            return extracted

        # Find Poi
        poi = root.find('.//Poi')
        if poi is not None:
            extracted['name'] = poi.attrib.get('name')
            extracted['dob'] = poi.attrib.get('dob')
            extracted['gender'] = poi.attrib.get('gender')

        # Find Poa
        poa = root.find('.//Poa')
        if poa is not None:
            extracted['careof'] = poa.attrib.get('co')
            extracted['house'] = poa.attrib.get('house')
            extracted['street'] = poa.attrib.get('street')
            extracted['landmark'] = poa.attrib.get('lm')
            extracted['location'] = poa.attrib.get('loc')
            extracted['vtc'] = poa.attrib.get('vtc')
            extracted['subdist'] = poa.attrib.get('subdist')
            extracted['district'] = poa.attrib.get('dist')
            extracted['state'] = poa.attrib.get('state')
            extracted['pincode'] = poa.attrib.get('pc')

        # Find Signature tag
        sig = root.find('.//{http://www.w3.org/2000/09/xmldsig#}Signature')
        extracted['has_signature'] = sig is not None

        return extracted
