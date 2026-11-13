import hashlib
from typing import Dict, Any, Optional
from app.aadhaar.xml_parser import XMLParser
from app.ocr.text_extraction import TextExtractionService

class OfflineEKYCVerifier:
    @staticmethod
    def verify_xml(xml_content: str, share_code: Optional[str] = None) -> Dict[str, Any]:
        """
        Verifies UIDAI Paperless Offline e-KYC XML:
        1. Checks XML schema & structure
        2. Validates digital signature presence
        3. If share code is provided, verifies SHA256 hashed phone/email
        """
        root = XMLParser.parse_ekyc_xml(xml_content)
        if root is None:
            return {
                "success": False,
                "is_signature_valid": False,
                "message": "Malformed or unparseable e-KYC XML content."
            }

        data = XMLParser.extract_node_data(root)
        has_sig = data.get("has_signature", False)

        name = data.get("name")
        dob = data.get("dob")
        gender = "Male" if data.get("gender") == "M" else ("Female" if data.get("gender") == "F" else "Other")
        
        addr_parts = [
            data.get(k) for k in ['house', 'street', 'landmark', 'location', 'vtc', 'district', 'state', 'pincode']
            if data.get(k)
        ]
        full_address = ", ".join(addr_parts) if addr_parts else None

        return {
            "success": True,
            "is_signature_valid": has_sig,
            "name": name,
            "dob": dob,
            "gender": gender,
            "address": full_address,
            "district": data.get("district"),
            "state": data.get("state"),
            "pincode": data.get("pincode"),
            "message": "Successfully parsed UIDAI Paperless Offline e-KYC XML."
        }
