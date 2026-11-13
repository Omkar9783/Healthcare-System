import difflib
from typing import Dict, Any, Optional, Tuple
from app.api.schemas import PatientMatchDetails, StatusFlag

class PatientMatcher:
    @staticmethod
    def _fuzzy_similarity(str1: str, str2: str) -> float:
        if not str1 or not str2:
            return 0.0
        s1 = str1.strip().lower()
        s2 = str2.strip().lower()
        if s1 == s2:
            return 1.0
        matcher = difflib.SequenceMatcher(None, s1, s2)
        return matcher.ratio()

    @classmethod
    def match(
        cls,
        extracted_doc: Dict[str, Any],
        patient_profile: Optional[Dict[str, Any]]
    ) -> Tuple[PatientMatchDetails, StatusFlag]:
        """
        Compares extracted document details (Aadhaar or Ration Card) against registered patient profile.
        Returns: (PatientMatchDetails, StatusFlag)
        """
        match = PatientMatchDetails()
        if not patient_profile:
            return match, StatusFlag.NOT_CHECKED

        notes = []
        patient_uid = patient_profile.get("uid")
        patient_name = patient_profile.get("name", "")
        patient_dob = patient_profile.get("dateOfBirth", "") # YYYY-MM-DD
        patient_gender = patient_profile.get("gender", "")
        patient_address = patient_profile.get("address", "")

        match.matched_patient_uid = patient_uid

        # 1. Name Matching
        doc_name = extracted_doc.get("name") or extracted_doc.get("head_of_family")
        if doc_name and patient_name:
            match.name_match_score = round(cls._fuzzy_similarity(doc_name, patient_name), 2)
            if match.name_match_score >= 0.80:
                notes.append(f"Strong Name Match ({match.name_match_score * 100:.0f}%): '{doc_name}' matches '{patient_name}'.")
            elif match.name_match_score >= 0.60:
                notes.append(f"Partial Name Match ({match.name_match_score * 100:.0f}%): '{doc_name}' vs '{patient_name}'.")
            else:
                notes.append(f"Low Name Correspondence ({match.name_match_score * 100:.0f}%): '{doc_name}' vs '{patient_name}'.")
        else:
            notes.append("Name could not be cross-referenced.")

        # 2. Date of Birth Matching
        doc_dob = extracted_doc.get("dob")
        doc_yob = extracted_doc.get("year_of_birth")
        if patient_dob:
            patient_yob = patient_dob.split('-')[0] if '-' in patient_dob else None
            if doc_dob:
                # Format might be DD/MM/YYYY vs YYYY-MM-DD
                parts = doc_dob.split('/')
                if len(parts) == 3:
                    formatted_doc_dob = f"{parts[2]}-{parts[1]}-{parts[0]}"
                    if formatted_doc_dob == patient_dob:
                        match.dob_matched = True
                        notes.append(f"Exact Date of Birth match: {patient_dob}.")
                elif doc_dob == patient_dob:
                    match.dob_matched = True
                    notes.append(f"Exact Date of Birth match: {patient_dob}.")

            if not match.dob_matched and doc_yob and patient_yob:
                if str(doc_yob) == str(patient_yob):
                    match.dob_matched = True
                    notes.append(f"Birth year matched: {doc_yob}.")

        # 3. Gender Matching
        doc_gender = extracted_doc.get("gender")
        if doc_gender and patient_gender:
            if doc_gender.strip().lower() == patient_gender.strip().lower():
                match.gender_matched = True
                notes.append(f"Gender verified: {patient_gender}.")
            else:
                notes.append(f"Gender divergence: Document indicates '{doc_gender}', profile has '{patient_gender}'.")

        # 4. Address Matching
        doc_address = extracted_doc.get("address")
        if doc_address and patient_address:
            match.address_match_score = round(cls._fuzzy_similarity(doc_address, patient_address), 2)
            if match.address_match_score >= 0.50:
                notes.append(f"Address alignment score: {match.address_match_score * 100:.0f}%.")

        # Compute overall match score (Weighted: Name 50%, DOB 25%, Gender 15%, Address 10%)
        overall = (
            (match.name_match_score * 0.50) +
            (0.25 if match.dob_matched else 0.0) +
            (0.15 if match.gender_matched else 0.0) +
            (match.address_match_score * 0.10)
        )
        match.overall_match_score = round(overall, 2)
        match.notes = notes

        if match.overall_match_score >= 0.75:
            flag = StatusFlag.MATCHED
        elif match.overall_match_score >= 0.50:
            flag = StatusFlag.PARTIAL_MATCH
        else:
            flag = StatusFlag.MISMATCH

        return match, flag
