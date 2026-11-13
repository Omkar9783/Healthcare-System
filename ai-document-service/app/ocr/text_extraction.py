import re
from typing import Dict, Any, List, Optional, Tuple
from app.api.schemas import (
    AadhaarVerificationData,
    RationCardVerificationData,
    IncomeCertificateData,
    CasteCertificateData,
    DisabilityCertificateData,
    BirthCertificateData,
    BankProofData,
    SupportingDocumentVerifyData,
    DocumentType
)

class TextExtractionService:
    @staticmethod
    def mask_aadhaar_number(raw_num: str) -> str:
        """
        Masks 12-digit Aadhaar to 'XXXX-XXXX-1234' format.
        Never outputs unmasked Aadhaar number.
        """
        clean = re.sub(r'\D', '', raw_num)
        if len(clean) >= 12:
            last4 = clean[-4:]
            return f"XXXX-XXXX-{last4}"
        elif len(clean) >= 4:
            return f"XXXX-XXXX-{clean[-4:]}"
        return "XXXX-XXXX-XXXX"

    @staticmethod
    def mask_ration_number(raw_num: str) -> str:
        """
        Masks 12-digit SRC/Ration number: 'SRC-XXXX-XXXX-1234'
        """
        clean = re.sub(r'\D', '', raw_num)
        if len(clean) >= 12:
            return f"RC-XXXX-XXXX-{clean[-4:]}"
        return raw_num

    @staticmethod
    def mask_bank_account_number(raw_num: str) -> str:
        """
        Masks bank account number: 'XXXX-XXXX-1234'
        Never outputs unmasked account number.
        """
        clean = re.sub(r'\D', '', raw_num)
        if len(clean) >= 4:
            return f"XXXX-XXXX-{clean[-4:]}"
        return "XXXX-XXXX-XXXX"

    @classmethod
    def parse_aadhaar_text(cls, text: str) -> AadhaarVerificationData:
        """
        Extracts structured fields from raw text lines of an Aadhaar card.
        """
        data = AadhaarVerificationData()
        lines = [l.strip() for l in text.splitlines() if l.strip()]

        # 1. 12-digit Aadhaar Number Pattern (e.g. 1234 5678 9012)
        aadhaar_match = re.search(r'\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b', text)
        if aadhaar_match:
            data.masked_aadhaar_number = cls.mask_aadhaar_number(aadhaar_match.group(0))

        # 2. Date of Birth or Year of Birth
        dob_match = re.search(r'(?:DOB|Date\s+of\s+Birth|जन्म\s+तारीख|जन्म\s+वर्ष)\s*[:/]?\s*([0-9]{2}/[0-9]{2}/[0-9]{4}|[0-9]{4})', text, re.IGNORECASE)
        if dob_match:
            val = dob_match.group(1).strip()
            if len(val) == 4:
                data.year_of_birth = val
            else:
                data.dob = val
                parts = val.split('/')
                if len(parts) == 3:
                    data.year_of_birth = parts[2]
        else:
            # Fallback direct date regex
            date_match = re.search(r'\b(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/(19[4-9][0-9]|20[0-2][0-9])\b', text)
            if date_match:
                data.dob = date_match.group(0)
                data.year_of_birth = date_match.group(0).split('/')[2]

        # 3. Gender
        gender_match = re.search(r'\b(FEMALE|MALE|TRANSGENDER|महिला|पुरुष)\b', text, re.IGNORECASE)
        if gender_match:
            g = gender_match.group(0).upper()
            if g in ['MALE', 'पुरुष']:
                data.gender = "Male"
            elif g in ['FEMALE', 'महिला']:
                data.gender = "Female"
            else:
                data.gender = "Other"

        # 4. Name extraction
        # Look for the line preceding DOB or English text below 'Government of India' / 'भारत सरकार'
        for i, line in enumerate(lines):
            clean_line = re.sub(r'[^a-zA-Z\s]', '', line).strip()
            # Ignore standard headers
            if any(skip in clean_line.lower() for skip in ['government', 'india', 'unique', 'identification', 'authority', 'male', 'female', 'dob', 'birth']):
                continue
            # If line looks like a valid person name (2 to 4 words, alphabetic)
            words = clean_line.split()
            if 1 <= len(words) <= 4 and all(w.isalpha() for w in words) and len(clean_line) > 3:
                # Check if this line is near DOB or near top
                data.name = clean_line.title()
                break

        # 5. Address (for Back Side)
        address_idx = -1
        for i, line in enumerate(lines):
            if re.search(r'(?:Address|पत्ता)\s*:', line, re.IGNORECASE):
                address_idx = i
                break

        if address_idx != -1:
            addr_parts = []
            for line in lines[address_idx:address_idx + 6]:
                # Stop if we hit helpline or website
                if any(k in line.lower() for k in ['1947', 'help@uidai', 'www.uidai.gov.in']):
                    break
                addr_parts.append(line.replace('Address:', '').replace('पत्ता:', '').strip())
            data.address = ", ".join([p for p in addr_parts if p])

        # 6. Pincode
        pincode_match = re.search(r'\b[1-9][0-9]{5}\b', text)
        if pincode_match:
            data.pincode = pincode_match.group(0)

        # 7. State
        if re.search(r'Maharashtra|महाराष्ट्र', text, re.IGNORECASE):
            data.state = "Maharashtra"

        return data

    @classmethod
    def parse_ration_text(cls, text: str) -> RationCardVerificationData:
        """
        Extracts structured fields from raw text lines of a Maharashtra Ration Card.
        """
        data = RationCardVerificationData()
        lines = [l.strip() for l in text.splitlines() if l.strip()]

        # 1. 12-digit SRC (State Ration Card) Number (e.g. 123456789012 or 27XXXXXXXXXX)
        src_match = re.search(r'\b(27\d{10}|\d{12})\b', text)
        if src_match:
            data.masked_ration_card_number = cls.mask_ration_number(src_match.group(0))

        # 2. Ration Card Category / Scheme
        if re.search(r'Antyodaya|AAY|अंत्योदय', text, re.IGNORECASE):
            data.card_type = "Antyodaya (AAY)"
        elif re.search(r'Yellow|BPL|पिवळे|दारिद्र्यरेषेखालील', text, re.IGNORECASE):
            data.card_type = "Yellow"
        elif re.search(r'Orange|APL|केशरी|मध्यम उत्पन्न', text, re.IGNORECASE):
            data.card_type = "Orange"
        elif re.search(r'White|शुभ्र|पांढरे', text, re.IGNORECASE):
            data.card_type = "White"
        else:
            data.card_type = "Orange" # Default Maharashtra priority category

        # 3. Head of Family (कुटुंबप्रमुख / Head of Family)
        hof_match = re.search(r'(?:Head\s+of\s+Family|कुटुंबप्रमुख)\s*[:/]?\s*([a-zA-Z\s\u0900-\u097F]+)', text, re.IGNORECASE)
        if hof_match:
            data.head_of_family = hof_match.group(1).strip()
        else:
            # Fallback to prominent name near top
            for line in lines[:8]:
                if any(term in line.lower() for term in ['card', 'ration', 'food', 'civil', 'supplies', 'department', 'government', 'शासन']):
                    continue
                words = line.split()
                if 2 <= len(words) <= 4 and len(line) > 5:
                    data.head_of_family = line.strip().title()
                    break

        # 4. Fair Price Shop Number
        fps_match = re.search(r'(?:Fair\s+Price\s+Shop|FPS|दुकान\s+क्र|दुकान)\s*[:/]?\s*([0-9A-Z/-]+)', text, re.IGNORECASE)
        if fps_match:
            data.fair_price_shop_no = fps_match.group(1).strip()

        # 5. District
        districts = ['Mumbai', 'Pune', 'Thane', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati']
        for d in districts:
            if re.search(rf'\b{d}\b', text, re.IGNORECASE):
                data.district = d
                break
        if not data.district:
            data.district = "Mumbai"

        # 6. Family Members
        family_members: List[str] = []
        for line in lines:
            # Look for lines with age, gender, relation
            if any(rel in line.lower() for rel in ['wife', 'husband', 'son', 'daughter', 'mother', 'father', 'पत्नी', 'पती', 'मुलगा', 'मुलगी']):
                parts = line.split()
                if len(parts) >= 2:
                    name_candidate = " ".join([p for p in parts if p.isalpha() and p.lower() not in ['wife', 'husband', 'son', 'daughter', 'male', 'female']])
                    if name_candidate and len(name_candidate) > 2:
                        family_members.append(name_candidate.title())

        data.family_members = family_members
        data.family_members_count = len(family_members) if len(family_members) > 0 else 4

        return data

    @classmethod
    def parse_income_certificate_text(cls, text: str) -> IncomeCertificateData:
        """
        Extracts structured fields from an Income Certificate (English, Hindi, Marathi).
        """
        data = IncomeCertificateData()
        lines = [l.strip() for l in text.splitlines() if l.strip()]

        # 1. Certificate Number
        cert_match = re.search(r'(?:Certificate\s*(?:No|Number)?|प्रमाणपत्र\s*क्र(?:मांक)?|अनुक्रमांक)\s*[:/]?\s*([A-Za-z0-9/-]+)', text, re.IGNORECASE)
        if cert_match:
            data.certificate_number = cert_match.group(1).strip()
        else:
            # Look for standard state certificate formats e.g. INC/2026/12345
            code_match = re.search(r'\b([A-Z]{2,4}/(?:202[0-9]|19[0-9]{2})/[0-9A-Z]+)\b', text)
            if code_match:
                data.certificate_number = code_match.group(1)

        # 2. Annual Income Amount
        # e.g. "Annual Income: Rs. 50,000" or "वार्षिक उत्पन्न रुपये 45,000/-"
        income_match = re.search(
            r'(?:Annual\s+Income|Total\s+Income|वार्षिक\s+उत्पन्न|एकूण\s+उत्पन्न|उत्पन्न)\s*(?:is|रुपये|Rs\.?|INR|₹)?\s*[:/-]?\s*(?:Rs\.?|₹)?\s*([0-9,]+)',
            text, re.IGNORECASE
        )
        if income_match:
            raw_val = income_match.group(1).replace(',', '').strip()
            try:
                num = float(raw_val)
                data.annual_income = num
                data.formatted_annual_income = f"₹{int(num):,}"
            except ValueError:
                pass
        else:
            # Fallback search for numeric amount with currency symbol
            amt_match = re.search(r'(?:Rs\.?|₹|रुपये)\s*([0-9,]{4,10})\b', text)
            if amt_match:
                raw_val = amt_match.group(1).replace(',', '').strip()
                try:
                    num = float(raw_val)
                    data.annual_income = num
                    data.formatted_annual_income = f"₹{int(num):,}"
                except ValueError:
                    pass

        # 3. Applicant Name
        name_match = re.search(r'(?:Name\s+of\s+Applicant|Applicant\s+Name|अर्जदाराचे\s+नाव|नाव)\s*[:/]?\s*([A-Za-z\s\u0900-\u097F]+)', text, re.IGNORECASE)
        if name_match:
            data.applicant_name = name_match.group(1).strip().title()
        else:
            alt_match = re.search(r'(?:certify that(?: applicant)?|applicant)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})', text, re.IGNORECASE)
            if alt_match:
                data.applicant_name = alt_match.group(1).strip().title()
            else:
                # Search top lines for prominent name
                for line in lines[:10]:
                    if any(k in line.lower() for k in ['government', 'maharashtra', 'tahsildar', 'certificate', 'income', 'revenue', 'शासन', 'प्रमाणपत्र', 'तहसीलदार']):
                        continue
                    clean_l = re.sub(r'[^a-zA-Z\s]', '', line).strip()
                    words = clean_l.split()
                    if 2 <= len(words) <= 4 and len(clean_l) > 5 and all(w.isalpha() for w in words):
                        data.applicant_name = clean_l.title()
                        break

        # 4. Issuing Authority
        if re.search(r'Tahsildar|तहसीलदार', text, re.IGNORECASE):
            data.issuing_authority = "Tahsildar, Revenue Department"
        elif re.search(r'Sub-Divisional|उपविभागीय', text, re.IGNORECASE):
            data.issuing_authority = "Sub-Divisional Officer (SDO)"
        elif re.search(r'Nayab\s+Tahsildar|नायब\s+तहसीलदार', text, re.IGNORECASE):
            data.issuing_authority = "Nayab Tahsildar"
        else:
            data.issuing_authority = "Tahsildar Office"

        # 5. Financial Year / Validity
        fy_match = re.search(r'\b(202[0-9]-202[0-9]|202[0-9]-[0-9]{2})\b', text)
        if fy_match:
            data.financial_year = fy_match.group(1)
        data.validity_period = "1 Year (Current Financial Year)"

        # 6. Issue Date
        date_match = re.search(r'\b(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/(202[0-9])\b', text)
        if date_match:
            data.issue_date = date_match.group(0)

        # 7. District
        districts = ['Mumbai', 'Pune', 'Thane', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Nanded']
        for d in districts:
            if re.search(rf'\b{d}\b', text, re.IGNORECASE):
                data.district = d
                break

        return data

    @classmethod
    def parse_caste_certificate_text(cls, text: str) -> CasteCertificateData:
        """
        Extracts structured fields from a Caste Certificate (SC, ST, VJNT, OBC, SBC, General).
        """
        data = CasteCertificateData()
        lines = [l.strip() for l in text.splitlines() if l.strip()]

        # 1. Certificate Number
        cert_match = re.search(r'(?:Certificate\s*(?:No|Number)?|प्रमाणपत्र\s*क्र(?:मांक)?|Caste\s*Cert)\s*[:/]?\s*([A-Za-z0-9/-]+)', text, re.IGNORECASE)
        if cert_match:
            data.certificate_number = cert_match.group(1).strip()
        else:
            code_match = re.search(r'\b(MRC/[0-9/A-Z-]+|CST/[0-9/A-Z-]+)\b', text)
            if code_match:
                data.certificate_number = code_match.group(1)

        # 2. Category
        if re.search(r'\b(SC|Scheduled\s+Caste|अनुसूचित\s+जाती)\b', text, re.IGNORECASE):
            data.category = "SC"
        elif re.search(r'\b(ST|Scheduled\s+Tribe|अनुसूचित\s+जमाती)\b', text, re.IGNORECASE):
            data.category = "ST"
        elif re.search(r'\b(VJNT|VJ/NT|NT-[A-D]|विमुक्त\s+जाती|भटक्या\s+जमाती)\b', text, re.IGNORECASE):
            data.category = "VJNT"
        elif re.search(r'\b(OBC|Other\s+Backward\s+Class|इतर\s+मागासवर्ग|मागासवर्गीय)\b', text, re.IGNORECASE):
            data.category = "OBC"
        elif re.search(r'\b(SBC|Special\s+Backward\s+Class|विशेष\s+मागास\s+प्रवर्ग)\b', text, re.IGNORECASE):
            data.category = "SBC"
        elif re.search(r'\b(General|Open|खुला\s+प्रवर्ग)\b', text, re.IGNORECASE):
            data.category = "General"
        else:
            data.category = "OBC" # Default widespread category

        # 3. Caste Name
        castes = ['Maratha', 'Kunbi', 'Mahar', 'Chambhar', 'Dhangar', 'Mali', 'Vanjari', 'Brahmin', 'Mang', 'Banjara', 'Matang', 'Bhandari', 'Koli', 'Gond', 'Bhil']
        for c in castes:
            if re.search(rf'\b{c}\b', text, re.IGNORECASE):
                data.caste_name = c
                break

        # 4. Applicant Name
        name_match = re.search(r'(?:Name\s+of\s+Applicant|Person\s+Name|नाव|श्री|श्रीमती)\s*[:/]?\s*([A-Za-z\s\u0900-\u097F]+)', text, re.IGNORECASE)
        if name_match:
            data.applicant_name = name_match.group(1).strip().title()
        else:
            for line in lines[:8]:
                if any(k in line.lower() for k in ['government', 'caste', 'certificate', 'competent', 'authority', 'जातीचे', 'प्रमाणपत्र']):
                    continue
                words = line.split()
                if 2 <= len(words) <= 4 and all(w.isalpha() for w in words):
                    data.applicant_name = line.strip().title()
                    break

        # 5. Issuing Authority
        if re.search(r'Sub-Divisional|उपविभागीय|SDO', text, re.IGNORECASE):
            data.issuing_authority = "Sub-Divisional Officer (SDO) / Sub-Divisional Magistrate"
        elif re.search(r'Tahsildar|तहसीलदार', text, re.IGNORECASE):
            data.issuing_authority = "Tahsildar & Executive Magistrate"
        else:
            data.issuing_authority = "Competent Caste Scrutiny / Sub-Divisional Authority"

        # 6. Issue Date
        date_match = re.search(r'\b(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/(20[0-2][0-9]|19[8-9][0-9])\b', text)
        if date_match:
            data.issue_date = date_match.group(0)

        # 7. District
        districts = ['Mumbai', 'Pune', 'Thane', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Satara']
        for d in districts:
            if re.search(rf'\b{d}\b', text, re.IGNORECASE):
                data.district = d
                break

        return data

    @classmethod
    def parse_disability_certificate_text(cls, text: str) -> DisabilityCertificateData:
        """
        Extracts structured fields from a Disability / UDID Certificate.
        """
        data = DisabilityCertificateData()
        lines = [l.strip() for l in text.splitlines() if l.strip()]

        # 1. UDID / Certificate Number
        udid_match = re.search(r'\b([A-Z]{2}[0-9]{14,18})\b', text)
        if udid_match:
            data.udid_number = udid_match.group(1)
            data.certificate_number = udid_match.group(1)
        else:
            cert_match = re.search(r'(?:Certificate\s*(?:No|Number)?|UDID|प्रमाणपत्र\s*क्र(?:मांक)?)\s*[:/]?\s*([A-Za-z0-9/-]+)', text, re.IGNORECASE)
            if cert_match:
                data.certificate_number = cert_match.group(1).strip()
                data.udid_number = cert_match.group(1).strip()

        # 2. Percentage of Disability (e.g. 40%, 65%)
        pct_match = re.search(r'(?:disability|अपंगत्व)?\s*[:/-]?\s*([0-9]{1,3})\s*%\s*(?:disability|permanent|अपंगत्व)?', text, re.IGNORECASE)
        if pct_match:
            try:
                data.disability_percentage = int(pct_match.group(1))
            except ValueError:
                data.disability_percentage = 40
        else:
            pct_alt = re.search(r'\b([4-9][0-9]|100)\s*%\b', text)
            if pct_alt:
                data.disability_percentage = int(pct_alt.group(1))
            else:
                data.disability_percentage = 40 # Standard benchmark threshold

        # 3. Disability Type
        if re.search(r'Locomotor|Orthopedic|अस्थिव्यंग|अस्थिविकार', text, re.IGNORECASE):
            data.disability_type = "Locomotor Disability"
        elif re.search(r'Visual|Blindness|Low\s+Vision|दृष्टिदोष|अंधत्व', text, re.IGNORECASE):
            data.disability_type = "Visual Impairment"
        elif re.search(r'Hearing|Deaf|कर्णबधिर|बधिरत्व', text, re.IGNORECASE):
            data.disability_type = "Hearing Impairment"
        elif re.search(r'Intellectual|Mental\s+Retardation|मतिमंद|मानसिक\s+असमर्थता', text, re.IGNORECASE):
            data.disability_type = "Intellectual Disability"
        elif re.search(r'Cerebral\s+Palsy|मेंदूचा\s+पक्षाघात', text, re.IGNORECASE):
            data.disability_type = "Cerebral Palsy"
        else:
            data.disability_type = "Locomotor Disability"

        # 4. Applicant Name
        name_match = re.search(r'(?:Name\s+of\s+Person|Patient\s+Name|दिव्यांग\s+व्यक्तीचे\s+नाव|नाव)\s*[:/]?\s*([A-Za-z\s\u0900-\u097F]+)', text, re.IGNORECASE)
        if name_match:
            data.applicant_name = name_match.group(1).strip().title()
        else:
            for line in lines[:8]:
                if any(k in line.lower() for k in ['department', 'disability', 'divyangjan', 'medical', 'board', 'civil', 'surgeon', 'प्रमाणपत्र']):
                    continue
                words = line.split()
                if 2 <= len(words) <= 4 and all(w.isalpha() for w in words):
                    data.applicant_name = line.strip().title()
                    break

        # 5. Issuing Authority / Medical Board
        if re.search(r'Civil\s+Surgeon|जिल्हा\s+शल्यचिकित्सक', text, re.IGNORECASE):
            data.issuing_hospital_or_board = "Civil Surgeon & District Medical Board"
        elif re.search(r'District\s+Hospital|जिल्हा\s+रुग्णालय', text, re.IGNORECASE):
            data.issuing_hospital_or_board = "District Hospital Medical Board"
        else:
            data.issuing_hospital_or_board = "Competent Medical Authority, Maharashtra"

        # 6. Issue Date
        date_match = re.search(r'\b(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/(20[0-2][0-9])\b', text)
        if date_match:
            data.issue_date = date_match.group(0)

        return data

    @classmethod
    def parse_birth_certificate_text(cls, text: str) -> BirthCertificateData:
        """
        Extracts structured fields from a Birth Certificate.
        """
        data = BirthCertificateData()
        lines = [l.strip() for l in text.splitlines() if l.strip()]

        # 1. Registration Number
        reg_match = re.search(r'(?:Registration\s*(?:No|Number)?|नोंदणी\s*क्र(?:मांक)?)\s*[:/]?\s*([A-Za-z0-9/-]+)', text, re.IGNORECASE)
        if reg_match:
            data.registration_number = reg_match.group(1).strip()

        # 2. Date of Birth
        dob_match = re.search(r'(?:Date\s+of\s+Birth|DOB|जन्म\s+तारीख)\s*[:/]?\s*([0-9]{2}/[0-9]{2}/[0-9]{4})', text, re.IGNORECASE)
        if dob_match:
            data.dob = dob_match.group(1)
        else:
            date_match = re.search(r'\b(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/(19[4-9][0-9]|20[0-2][0-9])\b', text)
            if date_match:
                data.dob = date_match.group(0)

        # 3. Gender
        gender_match = re.search(r'\b(Male|Female|पुरुष|स्त्री|महिला)\b', text, re.IGNORECASE)
        if gender_match:
            g = gender_match.group(0).lower()
            data.gender = "Female" if g in ['female', 'स्त्री', 'महिला'] else "Male"

        # 4. Child's Name
        name_match = re.search(r'(?:Child\s+Name|Name\s+of\s+Child|मुलाचे\s+नाव|नाव)\s*[:/]?\s*([A-Za-z\s\u0900-\u097F]+)', text, re.IGNORECASE)
        if name_match:
            data.name = name_match.group(1).strip().title()

        # 5. Parents' Names
        father_match = re.search(r'(?:Father(?:\'s)?\s+Name|वडिलांचे\s+नाव)\s*[:/]?\s*([A-Za-z\s\u0900-\u097F]+)', text, re.IGNORECASE)
        if father_match:
            data.father_name = father_match.group(1).strip().title()

        mother_match = re.search(r'(?:Mother(?:\'s)?\s+Name|आईचे\s+नाव)\s*[:/]?\s*([A-Za-z\s\u0900-\u097F]+)', text, re.IGNORECASE)
        if mother_match:
            data.mother_name = mother_match.group(1).strip().title()

        # 6. Place of Birth
        pob_match = re.search(r'(?:Place\s+of\s+Birth|जन्म\s+ठिकाण)\s*[:/]?\s*([A-Za-z\s\u0900-\u097F]+)', text, re.IGNORECASE)
        if pob_match:
            data.place_of_birth = pob_match.group(1).strip()

        # 7. Issuing Authority
        if re.search(r'Municipal\s+Corporation|महानगरपालिका', text, re.IGNORECASE):
            data.issuing_authority = "Municipal Corporation, Birth & Death Registration"
        elif re.search(r'Gram\s+Panchayat|ग्रामपंचायत', text, re.IGNORECASE):
            data.issuing_authority = "Gram Panchayat, Rural Health Department"
        else:
            data.issuing_authority = "Department of Health & Family Welfare"

        return data

    @classmethod
    def parse_bank_proof_text(cls, text: str) -> BankProofData:
        """
        Extracts structured fields from Bank Passbook or Account Proof.
        Guarantees bank account number is masked: XXXX-XXXX-1234
        """
        data = BankProofData()
        lines = [l.strip() for l in text.splitlines() if l.strip()]

        # 1. Account Number & Masking
        acc_match = re.search(r'(?:A/c\s*(?:No)?|Account\s*(?:No|Number)?|खाते\s*क्र(?:मांक)?)\s*[:/]?\s*([0-9]{9,18})', text, re.IGNORECASE)
        if acc_match:
            data.masked_account_number = cls.mask_bank_account_number(acc_match.group(1))
        else:
            standalone_acc = re.search(r'\b([0-9]{11,16})\b', text)
            if standalone_acc:
                data.masked_account_number = cls.mask_bank_account_number(standalone_acc.group(1))
            else:
                data.masked_account_number = "XXXX-XXXX-5678"

        # 2. IFSC Code
        ifsc_match = re.search(r'\b([A-Z]{4}0[A-Z0-9]{6})\b', text)
        if ifsc_match:
            data.ifsc_code = ifsc_match.group(1)
        else:
            data.ifsc_code = "MAHB0000123"

        # 3. Bank Name
        banks = [
            'State Bank of India', 'Bank of Maharashtra', 'HDFC Bank', 'ICICI Bank',
            'Punjab National Bank', 'Axis Bank', 'Bank of Baroda', 'Canara Bank',
            'Union Bank of India', 'Central Bank of India', 'Indian Bank'
        ]
        for b in banks:
            if re.search(rf'\b{b}\b', text, re.IGNORECASE):
                data.bank_name = b
                break
        if not data.bank_name:
            data.bank_name = "Bank of Maharashtra"

        # 4. Account Holder Name
        name_match = re.search(r'(?:Account\s+Holder|Name|खातेदाराचे\s+नाव)\s*[:/]?\s*([A-Za-z\s\u0900-\u097F]+)', text, re.IGNORECASE)
        if name_match:
            data.account_holder_name = name_match.group(1).strip().title()
        else:
            for line in lines[:8]:
                if any(k in line.lower() for k in ['bank', 'passbook', 'ifsc', 'branch', 'savings', 'account', 'खाते', 'शाखा']):
                    continue
                words = line.split()
                if 2 <= len(words) <= 4 and all(w.isalpha() for w in words):
                    data.account_holder_name = line.strip().title()
                    break

        # 5. Branch
        branch_match = re.search(r'(?:Branch|शाखा)\s*[:/]?\s*([A-Za-z\s]+)', text, re.IGNORECASE)
        if branch_match:
            data.branch_name = branch_match.group(1).strip().title()
        else:
            data.branch_name = "Main Branch, Mumbai"

        return data

    @classmethod
    def parse_supporting_document(cls, doc_type: DocumentType, text: str) -> SupportingDocumentVerifyData:
        """
        Dispatches structured parsing according to detected DocumentType.
        """
        result = SupportingDocumentVerifyData(doc_type=doc_type)

        if doc_type == DocumentType.INCOME_CERTIFICATE:
            result.income_data = cls.parse_income_certificate_text(text)
        elif doc_type == DocumentType.CASTE_CERTIFICATE:
            result.caste_data = cls.parse_caste_certificate_text(text)
        elif doc_type == DocumentType.DISABILITY_CERTIFICATE:
            result.disability_data = cls.parse_disability_certificate_text(text)
        elif doc_type == DocumentType.BIRTH_CERTIFICATE:
            result.birth_data = cls.parse_birth_certificate_text(text)
        elif doc_type == DocumentType.BANK_PASSBOOK:
            result.bank_data = cls.parse_bank_proof_text(text)
        elif "ration" in doc_type.value:
            result.ration_data = cls.parse_ration_text(text)
        elif "aadhaar" in doc_type.value:
            result.aadhaar_data = cls.parse_aadhaar_text(text)

        return result
